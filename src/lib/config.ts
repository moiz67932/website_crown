// src/lib/config.ts
// Minimal env validation helpers to fail fast when Cloud SQL config is missing.

export function assertCloudSqlEnv() {
  const missing: string[] = []
  if (!process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME) missing.push('CLOUDSQL_INSTANCE_CONNECTION_NAME')
  if (!process.env.DB_NAME) missing.push('DB_NAME')
  if (!process.env.DB_USER) missing.push('DB_USER')
  if (!process.env.DB_PASS) missing.push('DB_PASS')
  if (missing.length) {
    const msg = `Missing required DB environment variables: ${missing.join(', ')}.\n` +
      `Set Cloud SQL instance (project:region:instance) and Postgres credentials.\n` +
      `Optional: DB_IP_TYPE=PUBLIC|PRIVATE, PG_POOL_MAX, PG_IDLE_TIMEOUT_MS, PG_CONNECTION_TIMEOUT_MS.\n` +
      `Auth: Provide GCP_SA_KEY (service account JSON) in production or use ADC locally.`
    throw new Error(msg)
  }
}
