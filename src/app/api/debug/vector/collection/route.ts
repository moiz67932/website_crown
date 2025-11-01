import { NextResponse } from "next/server"
import { getCollectionInfo, resolveVectorSpec } from "../../../../../lib/qdrant"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const name = url.searchParams.get("name") || process.env.QDRANT_PROPERTY_COLLECTION || "properties_seo_v1"
  try {
    const info = await getCollectionInfo(name)
    const spec = await resolveVectorSpec()
    return NextResponse.json({ ok: true, name, info, spec })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 200 })
  }
}
