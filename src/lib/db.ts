// /src/lib/db.ts
import type { PoolConfig } from "pg";

let pool: import("pg").Pool | null = null;

async function makeCloudSqlPool(): Promise<import("pg").Pool> {
  const { Pool } = await import("pg");
  const { Connector, IpAddressTypes } = await import("@google-cloud/cloud-sql-connector");
  const { ExternalAccountClient } = await import("google-auth-library");
  const { getVercelOidcToken } = await import("@vercel/oidc");

  const instance = process.env.INSTANCE_CONNECTION_NAME;
  if (!instance) throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");

  const audience =
    process.env.GOOGLE_WIF_AUDIENCE ||
    `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${process.env.GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;

  const sa = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  if (!sa) throw new Error("GCP_SERVICE_ACCOUNT_EMAIL is required");

  // Build an ExternalAccountClient that pulls the subject token from Vercel at runtime
  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt", // per Vercel docs
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${sa}:generateAccessToken`,
    // <-- The key bit: get the OIDC ID token from Vercel dynamically (no temp file)
    subject_token_supplier: { getSubjectToken: getVercelOidcToken },
  } as any);

  const connector = new Connector({ auth: authClient || undefined });
  const ipType = (() => {
    const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
    if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
    if (raw === "PSC") return IpAddressTypes.PSC;
    return IpAddressTypes.PUBLIC;
  })();

  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType,
  });

  const cfg: PoolConfig = {
    ...clientOpts, // host/ssl/socket options provided by the connector
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || process.env.PG_CONNECTION_TIMEOUT_MS || 15_000),
  };

  return new Pool(cfg);
}

async function makeTcpPoolFromUrl(): Promise<import("pg").Pool> {
  const { Pool } = await import("pg");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  console.log("🌐 Using direct TCP connection via DATABASE_URL");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
  });
}

export async function getPool(): Promise<import("pg").Pool> {
  if (pool) return pool;
  try {
    if (process.env.INSTANCE_CONNECTION_NAME) {
      pool = await makeCloudSqlPool();
    } else if (process.env.DATABASE_URL) {
      pool = await makeTcpPoolFromUrl();
    } else {
      throw new Error("No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP).");
    }
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

// Back-compat alias
export const getPgPool = getPool;
