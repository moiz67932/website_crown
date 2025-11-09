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
 * Optionally writes a Google External Account JSON to /tmp and points ADC to it.
 * If VERCEL_OIDC_TOKEN_URL is not available (e.g., build time), skip gracefully.
 */
function ensureWifJsonOnDisk() {
  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  const saEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  const vercelOidcUrl = process.env.VERCEL_OIDC_TOKEN_URL; // may be absent during build

  // If any of these core values are missing, skip WIF setup
  if (!projectNumber || !poolId || !providerId || !saEmail || !vercelOidcUrl) {
    console.warn("⚠️ Skipping WIF JSON setup: missing one or more WIF/OIDC environment variables");
    return;
  }

  const creds = {
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    credential_source: {
      url: vercelOidcUrl
    }
  };

  const out = path.join("/tmp", "vercel-wif.json");
  const json = JSON.stringify(creds);

  try {
    const existing = fs.readFileSync(out, "utf8");
    if (existing !== json) fs.writeFileSync(out, json, "utf8");
  } catch {
    fs.writeFileSync(out, json, "utf8");
  }

  process.env.GOOGLE_APPLICATION_CREDENTIALS = out;
  process.env.GOOGLE_AUTH_SCOPES = "https://www.googleapis.com/auth/sqlservice.admin";

  console.log(`✅ Wrote WIF ADC JSON to ${out}`);
}

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = required("INSTANCE_CONNECTION_NAME");

  // only attempt WIF setup if we have the required fields
  try {
    ensureWifJsonOnDisk();
  } catch (err) {
    console.warn("⚠️ Failed to prepare WIF ADC JSON:", (err as Error).message);
  }

  console.log("☁️ Initializing Cloud SQL connector pool...");
  const connector = new Connector();

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

  // During build or when envs are incomplete, don’t crash the build
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" || process.env.VERCEL_ENV === "preview";

  try {
    if (process.env.INSTANCE_CONNECTION_NAME && process.env.GCP_SERVICE_ACCOUNT_EMAIL) {
      pool = await makeCloudSqlPool();
      console.log("✅ Database pool initialized via Cloud SQL Connector (WIF).");
    } else if (process.env.DATABASE_URL) {
      pool = await makeTcpPoolFromUrl();
      console.log("✅ Database pool initialized via DATABASE_URL.");
    } else if (isBuildTime) {
      console.warn("⚠️ Skipping DB initialization during build (no DB envs).");
      return null as any;
    } else {
      throw new Error(
        "No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP)."
      );
    }

    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    if (isBuildTime) {
      console.warn("⚠️ Continuing build without DB pool.");
      return null as any;
    }
    throw err;
  }
}

// Backward-compat alias
export const getPgPool = getPool;
