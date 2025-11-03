import fs from "node:fs";

export function setupWif() {
  const token = process.env.VERCEL_OIDC_TOKEN; // provided by Vercel at runtime
  const wif = process.env.GOOGLE_WIF_CONFIG_JSON; // your external_account JSON

  if (!token) throw new Error("VERCEL_OIDC_TOKEN not found. Ensure OIDC is enabled for this project.");
  if (!wif) throw new Error("GOOGLE_WIF_CONFIG_JSON not set.");

  // Write short-lived token + config to /tmp for ADC to read
  fs.writeFileSync("/tmp/vercel-oidc-token", token, { encoding: "utf8" });
  fs.writeFileSync("/tmp/google-wif.json", wif, { encoding: "utf8" });

  // Point all Google libs (incl. Cloud SQL Connector) to external_account ADC
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/google-wif.json";
}
