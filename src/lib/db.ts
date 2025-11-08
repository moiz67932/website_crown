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
 * Build an AuthClient that:
 *  - exchanges the Vercel OIDC JWT via Google STS,
 *  - impersonates your GCP service account,
 *  - includes the Cloud SQL Admin scope.
 */
async function makeAuthClient(): Promise<AuthClient> {
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const saEmail = required("GCP_SERVICE_ACCOUNT_EMAIL");

  // `subject_token_supplier` isn't in published typings yet -> cast options to any.
  const options: any = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    // Provide the Vercel OIDC token programmatically (do NOT use credential_source.url)
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  };

  // fromJSON returns BaseExternalAccountClient | null; narrow and cast to AuthClient
  const clientMaybe = ExternalAccountClient.fromJSON(options as any);
  if (!clientMaybe) {
    throw new Error("Failed to create ExternalAccountClient from JSON options");
  }

  // Ensure Cloud SQL Admin scope is set (explicit avoids surprises across lib versions).
  (clientMaybe as any).scopes = ["https://www.googleapis.com/auth/sqlservice.admin"];

  return clientMaybe as unknown as AuthClient;
}

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = required("INSTANCE_CONNECTION_NAME");

  console.log("☁️ Initializing Cloud SQL connector pool...");

  // Use our explicit external-account AuthClient.
  const authClient = await makeAuthClient();
  const connector = new Connector({ auth: authClient as any });

  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType: pickIpType(),
  });

  const cfg: PoolConfig = {
    ...clientOpts, // socket/ssl settings provided by connector
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
