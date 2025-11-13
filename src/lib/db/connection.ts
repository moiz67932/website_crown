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
  // Only attempt OIDC if we are on Vercel or we have a local token.
  const isVercelRuntime = process.env.VERCEL === '1';
  const hasLocalOidc = !!process.env.VERCEL_OIDC_TOKEN;

  if (!isVercelRuntime && !hasLocalOidc) return null;

  // Require the five GCP OIDC envs; otherwise skip OIDC
  const needed = [
    'GCP_PROJECT_NUMBER',
    'GCP_WORKLOAD_IDENTITY_POOL_ID',
    'GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID',
    'GCP_SERVICE_ACCOUNT_EMAIL',
  ] as const;
  for (const k of needed) if (!process.env[k]) return null;

  try {
    // Dynamically load to avoid burdening non-OIDC setups
    const { ExternalAccountClient } = await import('google-auth-library');
    const { getVercelOidcToken } = await import('@vercel/oidc');

    const audience =
      `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}` +
      `/locations/global/workloadIdentityPools/${process.env.GCP_WORKLOAD_IDENTITY_POOL_ID}` +
      `/providers/${process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;

    const authClient = (ExternalAccountClient as any).fromJSON({
      type: 'external_account',
      audience,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url:
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      // In Vercel functions it reads the header; in local dev it reads VERCEL_OIDC_TOKEN
      subject_token_supplier: { getSubjectToken: getVercelOidcToken },
    });

    return authClient;
  } catch {
    // If libs are not present or token can’t be sourced, skip OIDC so other modes work
    return null;
  }
}

function attachPoolEvents(p: Pool, mode: string) {
  p.on("error", () => {});
  p.on("connect", () => {});
}

async function createPool(): Promise<Pool> {
  // For localhost/development, prioritize DATABASE_URL to avoid OIDC token requirement
  const isLocalDev = process.env.NODE_ENV === 'development' || process.env.VERCEL !== '1';
  
  // 1) Use DATABASE_URL for local development (skip Cloud SQL Connector)
  if (isLocalDev && process.env.DATABASE_URL) {
    console.log('🌐 Local development detected - using direct DATABASE_URL connection');
    
    // Parse the connection string to check if it's a remote connection
    const url = process.env.DATABASE_URL;
    const isLocalhost = url.includes('127.0.0.1') || url.includes('localhost');
    
    // For Cloud SQL direct IP connections, always disable SSL cert verification
    // For localhost/proxy connections, no SSL needed
    let sslConfig: any = false;
    if (!isLocalhost) {
      sslConfig = { rejectUnauthorized: false };
      console.log('🔓 SSL certificate verification disabled for Cloud SQL direct connection');
    }
    
    const p = new Pool({
      connectionString: url,
      ssl: sslConfig,
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

  // 2) Use DB_HOST for local development with Cloud SQL Proxy
  if (isLocalDev && process.env.DB_HOST) {
    console.log('🌐 Local development detected - using DB_HOST connection (Cloud SQL Proxy)');
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

  // Prefer Cloud SQL if explicitly requested OR INSTANCE_CONNECTION_NAME is present (Vercel production)
  const preferCloud = process.env.DB_BACKEND === "cloudsql" || !!process.env.INSTANCE_CONNECTION_NAME;

  // 3) Cloud SQL via connector (works on Vercel with OIDC or locally with ADC)
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

    // Clean up connector when pool drains all clients
    p.on("remove", () => {
      try {
        // When no clients remain in the pool, close the Cloud SQL connector
        if ((p as any).totalCount === 0) {
          (connector as any).close?.();
        }
      } catch { /* ignore */ }
    });

    attachPoolEvents(p, "cloud-sql-connector");
    return p;
  }

  // 4) Fallback: Connection string (for Vercel or other environments without local dev flag)
  if (process.env.DATABASE_URL) {
    console.log('🌐 Using DATABASE_URL connection (fallback)');
    
    const url = process.env.DATABASE_URL;
    const isLocalhost = url.includes('127.0.0.1') || url.includes('localhost');
    
    // For Cloud SQL direct IP connections, always disable SSL cert verification
    // For localhost/proxy connections, no SSL needed
    let sslConfig: any = false;
    if (!isLocalhost) {
      sslConfig = { rejectUnauthorized: false };
      console.log('🔓 SSL certificate verification disabled for Cloud SQL direct connection');
    }
    
    const p = new Pool({
      connectionString: url,
      ssl: sslConfig,
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

  // 5) Fallback: Plain TCP (for other environments)
  if (process.env.DB_HOST) {
    console.log('🌐 Using DB_HOST connection (fallback)');
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
