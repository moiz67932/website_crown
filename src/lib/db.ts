// /src/lib/db.ts
// Drop-in replacement that fixes "No valid AWS credential_source provided"
// by generating an External Account (WIF) JSON on disk and using ADC.
//
// Requirements (runtime env):
//   - INSTANCE_CONNECTION_NAME="PROJECT:REGION:INSTANCE"
//   - GCP_PROJECT_NUMBER, GCP_WORKLOAD_IDENTITY_POOL_ID, GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
//   - GCP_SERVICE_ACCOUNT_EMAIL (the SA you impersonate, with Cloud SQL Admin + iam.serviceAccountTokenCreator)
//   - VERCEL_OIDC_TOKEN_URL (Vercel provides this when OIDC is enabled)
// Optional:
//   - DB_USER, DB_PASS/DB_PASSWORD, DB_NAME
//   - DB_IP_TYPE = PUBLIC | PRIVATE | PSC   (default PUBLIC)
//   - PG_POOL_MAX, PG_IDLE_TIMEOUT_MS, PG_CONNECTION_TIMEOUT_MS
//   - DATABASE_URL (if you want direct TCP fallback)
//
// Notes:
// - We do NOT manually new ExternalAccountClient(); the Cloud SQL connector
//   uses ADC (GOOGLE_APPLICATION_CREDENTIALS) and Just Works with WIF JSON.
// - subject_token_type MUST be id_token for OIDC WIF.

import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let pool: Pool | null = null;

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function pickIpType(): IpAddressTypes {
  const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
  if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
  if (raw === "PSC") return IpAddressTypes.PSC;
  return IpAddressTypes.PUBLIC;
}

/**
 * Ensure a valid External Account (OIDC WIF) JSON exists on disk and
 * GOOGLE_APPLICATION_CREDENTIALS points to it. Safe to call multiple times.
 *
 * Vercel provides the runtime OIDC endpoint in VERCEL_OIDC_TOKEN_URL.
 * We wire that into `credential_source.url`, which google-auth will call
 * to obtain the subject token (ID token) for STS exchange.
 */
function ensureWifJsonOnDisk(): string {
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const saEmail = required("GCP_SERVICE_ACCOUNT_EMAIL");
  const oidcUrl = required("VERCEL_OIDC_TOKEN_URL"); // Provided by Vercel when OIDC is enabled

  // Reuse file if already created during this boot.
  const target = process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    ? process.env.GOOGLE_APPLICATION_CREDENTIALS!
    : path.join("/tmp", "vercel-wif.json");

  // Minimal-but-correct external_account JSON for OIDC WIF with SA impersonation.
  const config = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    credential_source: {
      // google-auth will HTTP GET this URL to fetch the OIDC ID token
      url: oidcUrl
    }
  };

  // Write (or rewrite) atomically each boot; small file so it’s fine.
  fs.writeFileSync(target, JSON.stringify(config), { encoding: "utf8" });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = target;

  // Hint scopes for some auth stacks; harmless if unused.
  process.env.GOOGLE_AUTH_SCOPES = process.env.GOOGLE_AUTH_SCOPES
    || "https://www.googleapis.com/auth/sqlservice.admin";

  return target;
}

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = required("INSTANCE_CONNECTION_NAME");

  // Make sure ADC is set to our WIF file BEFORE constructing the connector.
  const credPath = ensureWifJsonOnDisk();
  console.log(`☁️ ADC set to external-account JSON: ${credPath}`);

  const connector = new Connector(); // will use ADC picked up from GOOGLE_APPLICATION_CREDENTIALS

  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType: pickIpType(),
  });

  const cfg: PoolConfig = {
    ...clientOpts,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "redata",
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(
      process.env.PG_CONNECTION_TIMEOUT_MS || process.env.PG_CONN_TIMEOUT_MS || 15_000
    ),
  };

  return new Pool(cfg);
}

async function makeTcpPoolFromUrl(): Promise<Pool> {
  const url = required("DATABASE_URL");
  console.log("🌐 Using direct TCP connection via DATABASE_URL");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 15_000),
  });
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  try {
    if (process.env.INSTANCE_CONNECTION_NAME) {
      pool = await makeCloudSqlPool();
    } else if (process.env.DATABASE_URL) {
      pool = await makeTcpPoolFromUrl();
    } else {
      throw new Error(
        "No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL via connector) or DATABASE_URL (direct TCP)."
      );
    }
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

// Back-compat alias
export const getPgPool = getPool;
