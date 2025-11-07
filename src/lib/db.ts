// /src/lib/db.ts
import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth, ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let pool: Pool | null = null;

function pickIpType(): IpAddressTypes {
  const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
  if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
  if (raw === "PSC") return IpAddressTypes.PSC;
  return IpAddressTypes.PUBLIC;
}

async function makeConnectorAuth(): Promise<GoogleAuth> {
  const projectNumber = process.env.GCP_PROJECT_NUMBER!;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID!;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID!;
  const saEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL!;

  // External Account config that uses Vercel's runtime OIDC token supplier.
  const externalAccountOptions = {
    type: "external_account",
    // The "audience" here is the full provider resource on GCP (not the Vercel URL).
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    // Vercel returns a JWT; use the JWT token type (per Vercel doc example).
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    // Programmatic supplier: do NOT use credential_source.url
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  } as const;

  // Build a GoogleAuth that uses these External Account credentials
  // and has the scope required by the Cloud SQL Connector.
  const authClient = ExternalAccountClient.fromJSON(externalAccountOptions);
  return new GoogleAuth({
    credentials: externalAccountOptions, // also acceptable; lib will create the client
    scopes: ["https://www.googleapis.com/auth/sqlservice.admin"],
  });
}

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = process.env.INSTANCE_CONNECTION_NAME;
  if (!instance) {
    throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");
  }

  console.info("☁️ Initializing Cloud SQL connector pool...");

  // Use custom GoogleAuth backed by Vercel OIDC → GCP WIF
  const auth = await makeConnectorAuth();
  const connector = new Connector({ auth });

  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType: pickIpType(),
  });

  const cfg: PoolConfig = {
    ...clientOpts, // host/socket/ssl from connector
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "redata",
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || process.env.PG_CONN_TIMEOUT_MS || 15_000),
  };

  return new Pool(cfg);
}

async function makeTcpPoolFromUrl(): Promise<Pool> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
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
      throw new Error("No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP).");
    }
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

export const getPgPool = getPool;
