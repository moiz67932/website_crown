// src/lib/db/connection.ts
// Unified Postgres pool with Cloud SQL Connector (works on Vercel OIDC + local)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pool, PoolConfig } from "pg";

let connectorModule: any;
let pool: Pool | null = null;
let initializing: Promise<Pool> | null = null;

const resetListeners: Array<() => void> = [];
export function onPoolReset(fn: () => void) { resetListeners.push(fn); }
export async function resetPgPool(reason = "manual-reset") {
  const old = pool;
  pool = null;
  initializing = null;
  if (old) { try { await old.end(); } catch { /* ignore */ } }
  for (const fn of resetListeners) { try { fn(); } catch { /* ignore */ } }
}

/**
 * Build an ExternalAccountClient that exchanges Vercel’s OIDC token for a GCP access token,
 * then impersonates your service account. Only runs on Vercel.
 */
async function buildVercelExternalAuth() {
  // Require the five GCP OIDC envs; otherwise return null and the connector will use ADC.
  const req = [
    "GCP_PROJECT_NUMBER",
    "GCP_WORKLOAD_IDENTITY_POOL_ID",
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
    "GCP_SERVICE_ACCOUNT_EMAIL",
  ] as const;
  for (const k of req) if (!process.env[k]) return null;

  try {
    // Loaded dynamically so local dev doesn’t need @vercel/oidc.
    const { ExternalAccountClient } = await import("google-auth-library");
    let getVercelOidcToken: undefined | (() => Promise<string>);
    try {
      // Available in Vercel runtime when OIDC is configured
      const m = await import("@vercel/oidc");
      getVercelOidcToken = (m as any).getVercelOidcToken;
    } catch {
      return null;
    }
    if (!getVercelOidcToken) return null;

    const audience =
      `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}` +
      `/locations/global/workloadIdentityPools/${process.env.GCP_WORKLOAD_IDENTITY_POOL_ID}` +
      `/providers/${process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;

    // External account client that uses Vercel’s OIDC JWT as the subject token,
    // then impersonates your GCP service account.
    const authClient = (ExternalAccountClient as any).fromJSON({
      type: "external_account",
      audience,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url:
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: getVercelOidcToken },
    });

    return authClient;
  } catch {
    return null;
  }
}

function attachPoolEvents(p: Pool, mode: string) {
  p.on("error", () => {});
  p.on("connect", () => {});
}

async function createPool(): Promise<Pool> {
  // Prefer Cloud SQL if explicitly requested OR INSTANCE_CONNECTION_NAME is present
  const preferCloud = process.env.DB_BACKEND === "cloudsql" || !!process.env.INSTANCE_CONNECTION_NAME;

  // 1) Cloud SQL via connector (works on Vercel with OIDC or locally with ADC)
  if (preferCloud) {
    const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
    if (!instanceConnectionName) {
      throw new Error("DB_BACKEND=cloudsql set, but INSTANCE_CONNECTION_NAME is missing (format project:region:instance).");
    }

    if (!connectorModule) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      connectorModule = await import("@google-cloud/cloud-sql-connector");
    }
    const { Connector } = connectorModule;

    // On Vercel, use OIDC→WIF auth. Locally, this returns null and the connector uses ADC by default.
    const externalAuth = await buildVercelExternalAuth();
    const connector = new Connector(externalAuth ? { auth: externalAuth } : undefined);

    const clientOpts = await connector.getOptions({
      instanceConnectionName,
      ipType: "PUBLIC",
    });

    const p = new Pool({
      ...clientOpts,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 5,
      idleTimeoutMillis: 20_000,
      statement_timeout: 60_000,
      query_timeout: 60_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5_000,
    } as any);

    // Reset the connector when the pool closes
    p.on("end", () => { try { (connector as any).close?.(); } catch {} });

    attachPoolEvents(p, "cloud-sql-connector");
    return p;
  }

  // 2) Connection string (Docker/local etc.)
  if (process.env.DATABASE_URL) {
    const p = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 20_000,
      statement_timeout: 60_000,
      query_timeout: 60_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5_000,
    } as any);
    attachPoolEvents(p, "connection-string");
    return p;
  }

  // 3) Plain TCP (e.g., local Cloud SQL Proxy with DB_HOST=127.0.0.1)
  if (process.env.DB_HOST) {
    const cfg: PoolConfig = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
      idleTimeoutMillis: 20_000,
    };
    if (process.env.DB_SSL === "true") {
      (cfg as any).ssl = { rejectUnauthorized: false };
    }
    const p = new Pool({
      ...cfg,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5_000,
      statement_timeout: 60_000,
      query_timeout: 60_000,
    } as any);
    attachPoolEvents(p, "tcp");
    return p;
  }

  throw new Error("No DB config found. Set DATABASE_URL, or DB_HOST, or DB_BACKEND=cloudsql + INSTANCE_CONNECTION_NAME.");
}

export async function getPgPool(): Promise<Pool> {
  if (pool) return pool;
  if (!initializing) {
    initializing = createPool().then(async (p) => {
      try { await p.query("SELECT 1"); } catch {}
      // Auto-reset on common fatal errors
      p.on("error", (err: any) => {
        const code = (err && (err as any).code) || "";
        const low = String(err?.message || "").toLowerCase();
        const transient =
          ["connection terminated unexpectedly","econnreset","server closed the connection unexpectedly",
           "terminating connection due to administrator command","could not receive data from server","reset by peer"]
            .some(t => low.includes(t)) || ["57P01","57P02","57P03","53300","53400","08006","08000"].includes(code);
        if (transient) setTimeout(() => resetPgPool("fatal-error:" + (code || low.slice(0,40))), 50);
      });
      pool = p;
      return p;
    });
  }
  return initializing;
}

export async function pgHealthCheck(): Promise<boolean> {
  try { await (await getPgPool()).query("SELECT 1"); return true; } catch { return false; }
}
