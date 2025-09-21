export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // TODO: store in Supabase 'web_vitals' table
    return Response.json({ ok: true })
  } catch {
    return new Response(null, { status: 204 })
  }
}