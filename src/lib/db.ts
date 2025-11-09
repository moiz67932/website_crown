// // /src/lib/db.ts
// import { Pool, PoolConfig } from "pg";
// import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
// import fs from "node:fs";
// import path from "node:path";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// let pool: Pool | null = null;

// function required(name: string): string {
//   const v = process.env[name];
//   if (!v) throw new Error(`Missing required env: ${name}`);
//   return v;
// }

// function pickIpType(): IpAddressTypes {
//   const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
//   if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
//   if (raw === "PSC") return IpAddressTypes.PSC;
//   return IpAddressTypes.PUBLIC;
// }

// /**
//  * Write a Google External Account JSON to /tmp and point ADC to it.
//  * This is the most reliable way for the Cloud SQL Connector to pick up WIF creds.
//  */
// function ensureWifJsonOnDisk() {
//   const projectNumber = required("GCP_PROJECT_NUMBER");
//   const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
//   const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
//   const saEmail = required("GCP_SERVICE_ACCOUNT_EMAIL");
//   const vercelOidcUrl = required("VERCEL_OIDC_TOKEN_URL"); // provided by Vercel at runtime

//   const creds = {
//     type: "external_account",
//     audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
//     subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
//     token_url: "https://sts.googleapis.com/v1/token",
//     service_account_impersonation_url:
//       `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
//     // IMPORTANT: this must be the actual URL (no env interpolation inside JSON)
//     credential_source: {
//       url: vercelOidcUrl
//     }
//   };

//   const out = path.join("/tmp", "vercel-wif.json");
//   const json = JSON.stringify(creds);
//   // Only rewrite if changed to avoid unnecessary IO
//   try {
//     const existing = fs.readFileSync(out, "utf8");
//     if (existing !== json) fs.writeFileSync(out, json, "utf8");
//   } catch {
//     fs.writeFileSync(out, json, "utf8");
//   }

//   // Force ADC to use this file
//   process.env.GOOGLE_APPLICATION_CREDENTIALS = out;
//   // Be explicit about required scope for the connector
//   process.env.GOOGLE_AUTH_SCOPES = "https://www.googleapis.com/auth/sqlservice.admin";

//   console.log(`✅ Wrote WIF ADC JSON to ${out}`);
// }

// async function makeCloudSqlPool(): Promise<Pool> {
//   const instance = required("INSTANCE_CONNECTION_NAME");
//   ensureWifJsonOnDisk();

//   console.log("☁️ Initializing Cloud SQL connector pool...");
//   // Let the connector use ADC (it will pick up GOOGLE_APPLICATION_CREDENTIALS we set)
//   const connector = new Connector();

//   const clientOpts = await connector.getOptions({
//     instanceConnectionName: instance,
//     ipType: pickIpType(),
//   });

//   const cfg: PoolConfig = {
//     ...clientOpts, // socket/ssl settings provided by connector
//     user: process.env.DB_USER || "postgres",
//     password: process.env.DB_PASS || process.env.DB_PASSWORD,
//     database: process.env.DB_NAME || "redata",
//     max: Number(process.env.PG_POOL_MAX || 8),
//     idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
//     connectionTimeoutMillis: Number(
//       process.env.PG_CONNECTION_TIMEOUT_MS || process.env.PG_CONN_TIMEOUT_MS || 15_000
//     ),
//   };

//   return new Pool(cfg);
// }

// async function makeTcpPoolFromUrl(): Promise<Pool> {
//   const url = required("DATABASE_URL");
//   console.log("🌐 Using direct TCP connection via DATABASE_URL");
//   return new Pool({
//     connectionString: url,
//     ssl: { rejectUnauthorized: false },
//     max: Number(process.env.PG_POOL_MAX || 8),
//     idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
//     connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 15_000),
//   });
// }

// export async function getPool(): Promise<Pool> {
//   if (pool) return pool;
//   try {
//     if (process.env.INSTANCE_CONNECTION_NAME) {
//       pool = await makeCloudSqlPool();
//     } else if (process.env.DATABASE_URL) {
//       pool = await makeTcpPoolFromUrl();
//     } else {
//       throw new Error(
//         "No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP)."
//       );
//     }
//     return pool;
//   } catch (err) {
//     console.error("❌ Failed to initialize Postgres pool:", err);
//     throw err;
//   }
// }

// // Back-compat alias
// export const getPgPool = getPool;






















// /src/lib/db.ts
import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let pool: Pool | null = null;

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`❌ Missing required env: ${name}`);
  return v;
}

function pickIpType(): IpAddressTypes {
  const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
  if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
  if (raw === "PSC") return IpAddressTypes.PSC;
  return IpAddressTypes.PUBLIC;
}

/**
 * Build a Google ExternalAccountClient using Vercel's OIDC token.
 */
async function makeAuthClient() {
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const saEmail = required("GCP_SERVICE_ACCOUNT_EMAIL");

  const oidcToken = await getVercelOidcToken();
  if (!oidcToken) throw new Error("❌ Failed to obtain OIDC token from Vercel");

  const opts: any = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    credential_source: { // directly provide the subject token instead of URL
      environment_id: "vercel.oidc",
      credential_source_type: "vercel",
      subject_token: oidcToken,
    },
  };

  const client = ExternalAccountClient.fromJSON(opts);
  if (!client) throw new Error("❌ Failed to initialize ExternalAccountClient");
  (client as any).scopes = ["https://www.googleapis.com/auth/sqlservice.admin"];

  return client;
}

/**
 * Create the Cloud SQL connection pool.
 */
async function makeCloudSqlPool(): Promise<Pool> {
  const instance = required("INSTANCE_CONNECTION_NAME");
  console.log("☁️ Initializing Cloud SQL connector via WIF...");

  const authClient = await makeAuthClient();
  const connector = new Connector({ auth: authClient as any });

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
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(
      process.env.PG_CONNECTION_TIMEOUT_MS || 15000
    ),
  };

  return new Pool(cfg);
}

/**
 * Optional fallback: direct TCP if DATABASE_URL exists
 */
async function makeTcpPoolFromUrl(): Promise<Pool> {
  const url = required("DATABASE_URL");
  console.log("🌐 Using direct TCP connection via DATABASE_URL");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
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
      throw new Error("No DB config: need INSTANCE_CONNECTION_NAME or DATABASE_URL");
    }
    console.log("✅ Connected to Postgres");
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

// Back-compat alias
export const getPgPool = getPool;
