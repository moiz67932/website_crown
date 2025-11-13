// /src/lib/db.ts
import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import type { AuthClient } from "google-auth-library";
import { ExternalAccountClient } from "google-auth-library";
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

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

/**
 * Build an AuthClient backed by Vercel OIDC → Google STS (WIF) → SA impersonation.
 * No VERCEL_OIDC_* envs required because we inject the token via subject_token_supplier.
 */
async function makeAuthClient(): Promise<AuthClient> {
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const saEmail = required("GCP_SERVICE_ACCOUNT_EMAIL");

  // NOTE: subject_token_type should be ID token for OIDC:
  // urn:ietf:params:oauth:token-type:id_token
  const options: any = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    // Provide the Vercel OIDC token programmatically (avoid credential_source.url)
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  };

  const clientMaybe = ExternalAccountClient.fromJSON(options as any);
  if (!clientMaybe) {
    throw new Error("Failed to create ExternalAccountClient from JSON options");
  }
  // Explicit scope to be safe across lib versions.
  (clientMaybe as any).scopes = ["https://www.googleapis.com/auth/sqlservice.admin"];
  return clientMaybe as unknown as AuthClient;
}

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = required("INSTANCE_CONNECTION_NAME");

  // If the app is running with full ADC (rare on Vercel, but harmless), the
  // Connector can pick that up too; we prefer our explicit WIF client below.
  const authClient = await makeAuthClient();
  const connector = new Connector({ auth: authClient as any });

  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType: pickIpType(),
  });

  const cfg: PoolConfig = {
    ...clientOpts, // socket/ssl settings from Connector
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
  
  // Check if it's a localhost/proxy connection
  const isLocalhost = url.includes('127.0.0.1') || url.includes('localhost');
  
  // For Cloud SQL direct IP connections, always disable SSL cert verification
  // For localhost/proxy connections, no SSL needed
  let sslConfig: any = false;
  if (!isLocalhost) {
    sslConfig = { rejectUnauthorized: false };
    console.log("🔓 SSL certificate verification disabled for Cloud SQL direct connection");
  }
  
  return new Pool({
    connectionString: url,
    ssl: sslConfig,
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 15_000),
  });
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  try {
    // For localhost/development, prioritize DATABASE_URL to avoid OIDC token requirement
    const isLocalDev = process.env.NODE_ENV === 'development' || process.env.VERCEL !== '1';
    
    // Localhost: Use DATABASE_URL directly (no Cloud SQL Connector needed)
    if (isLocalDev && process.env.DATABASE_URL) {
      console.log("🌐 Local development detected - using DATABASE_URL");
      pool = await makeTcpPoolFromUrl();
      return pool;
    }

    // Vercel/Production: Use Cloud SQL Connector with OIDC
    if (process.env.INSTANCE_CONNECTION_NAME) {
      console.log("☁️ Initializing Cloud SQL pool (Connector + WIF) …");
      pool = await makeCloudSqlPool();
    } else if (process.env.DATABASE_URL) {
      pool = await makeTcpPoolFromUrl();
    } else {
      throw new Error(
        "No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP)."
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
