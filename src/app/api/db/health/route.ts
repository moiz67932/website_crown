// src/app/api/db/health/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/connection";

export async function GET() {
  const sql = `
    WITH c AS (SELECT COUNT(*)::int AS properties_count FROM properties)
    SELECT current_database() AS db,
           current_user     AS user,
           inet_server_addr()::text AS host,
           c.properties_count
    FROM c;
  `;
  const { rows } = await pool.query(sql);
  console.log("[db-health]", rows[0]);
  return NextResponse.json(rows[0]);
}
