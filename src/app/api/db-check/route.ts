// /src/app/api/db-check/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool();
    const { rows } = await pool.query("select now() as ts");
    return NextResponse.json({
      ok: true,
      via: "db-check",
      ts: rows?.[0]?.ts ?? null,
    });
  } catch (err: any) {
    console.error("db-check failed:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
