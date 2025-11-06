// import { Pool, PoolConfig } from "pg";


// let pool: Pool | null = null;

// // Lazy import to keep cold start small
// async function makeCloudSqlPool(): Promise<Pool> {
//   const { Connector, IpAddressTypes } = await import("@google-cloud/cloud-sql-connector");
//   const { GoogleAuth } = await import("google-auth-library");

//   const instance = process.env.INSTANCE_CONNECTION_NAME;
//   if (!instance) throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");

//   // Prefer WIF if provided; otherwise allow a raw SA key (not recommended on Vercel)
//   let credentials: any | undefined = undefined;
//   if (process.env.GOOGLE_WIF_CONFIG_JSON) {
//     credentials = JSON.parse(process.env.GOOGLE_WIF_CONFIG_JSON);
//     console.log("🔐 Using WIF external_account credentials for Cloud SQL");
//   } else {
//     throw new Error("No Google credentials found. Set GOOGLE_WIF_CONFIG_JSON.");
//   }

//   const auth = new GoogleAuth({
//     credentials,
//     // Cloud SQL Admin scope is required for connector to fetch ephemeral certs
//     scopes: ["https://www.googleapis.com/auth/sqlservice.admin"],
//   });

//   const connector = new Connector({ auth });
//   const clientOpts = await connector.getOptions({
//     instanceConnectionName: instance,
//     ipType: (() => {
//       const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
//       if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
//       if (raw === "PSC") return IpAddressTypes.PSC;
//       return IpAddressTypes.PUBLIC;
//     })(),
//   });

//   const cfg: PoolConfig = {
//     ...clientOpts, // supplies host/socket, ssl, etc.
//     user: process.env.DB_USER || "postgres",
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     max: Number(process.env.PG_POOL_MAX || 8),
//     idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
//     connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
//   };

//   return new Pool(cfg);
// }

// async function makeTcpPoolFromUrl(): Promise<Pool> {
//   const url = process.env.DATABASE_URL;
//   if (!url) throw new Error("DATABASE_URL not set");
//   console.log("🌐 Using direct TCP connection via DATABASE_URL");
//   return new Pool({
//     connectionString: url,
//     ssl: { rejectUnauthorized: false }, // required for many managed Postgres setups
//     max: Number(process.env.PG_POOL_MAX || 8),
//     idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
//     connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
//   });
// }

// export async function getPool(): Promise<Pool> {
//   if (pool) return pool;

//   try {
//     // Prefer Cloud SQL connector when INSTANCE_CONNECTION_NAME is set
//     if (process.env.INSTANCE_CONNECTION_NAME) {
//       pool = await makeCloudSqlPool();
//     } else if (process.env.DATABASE_URL) {
//       pool = await makeTcpPoolFromUrl();
//     } else {
//       throw new Error("No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP).");
//     }
//     return pool;
//   } catch (err) {
//     console.error("❌ Failed to initialize Postgres pool:", err);
//     throw err;
//   }
// }

// // Back-compat alias for modules that import getPgPool
// export const getPgPool = getPool;













// src/lib/db.ts
import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { ExternalAccountClient, GoogleAuth } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

let pool: Pool | null = null;

function makeAuthClient() {
  const projectNumber = process.env.GCP_PROJECT_NUMBER!;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID!;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID!;
  const saEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL!;
  if (!projectNumber || !poolId || !providerId || !saEmail) {
    throw new Error("Missing GCP OIDC envs (project number, pool/provider IDs, SA email).");
  }

  // Build an ExternalAccountClient that uses Vercel's OIDC subject token at runtime
  const eac = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
    subject_token_supplier: {
      // Vercel’s helper returns the OIDC JWT; no need to read /tmp files
      getSubjectToken: getVercelOidcToken,
    },
  });

  // The Cloud SQL Node connector accepts either an AuthClient or a GoogleAuth
  // (ExternalAccountClient extends AuthClient), so we can pass it directly.
  // Alternatively:
  //   const auth = new GoogleAuth({ authClient: eac });
  return eac;
}

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = process.env.INSTANCE_CONNECTION_NAME;
  if (!instance) throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");

  const authClient = makeAuthClient();

  const connector = new Connector({ auth: authClient || undefined });
  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType: (() => {
      const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
      if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
      if (raw === "PSC") return IpAddressTypes.PSC;
      return IpAddressTypes.PUBLIC;
    })(),
  });

  const cfg: PoolConfig = {
    ...clientOpts, // host/socket + TLS handled by connector
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
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
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
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
      throw new Error("No DB config: set INSTANCE_CONNECTION_NAME or DATABASE_URL.");
    }
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

export const getPgPool = getPool;
