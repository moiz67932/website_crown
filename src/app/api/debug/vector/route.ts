export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getQdrant } from "../../../../lib/qdrant"

export async function GET() {
  try {
    const q = getQdrant()
    if (!q) {
      return NextResponse.json({ ok: false, reason: "QDRANT_URL missing" }, { status: 200 })
    }
    const res = await q.getCollections()
    return NextResponse.json({ ok: true, collections: (res as any)?.collections || (res as any)?.result?.collections }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 200 })
  }
}
