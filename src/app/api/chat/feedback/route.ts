import { NextRequest } from "next/server"
import { supaServer } from '../../../../lib/supabase'

function admin() { return supaServer() }

export async function POST(req: NextRequest) {
  const { session_id, rating, note } = await req.json()
  // optional table: chat_feedback(session_id uuid, rating int, note text, created_at timestamptz)
  await admin().from("chat_feedback").insert({ session_id, rating, note }).throwOnError()
  return Response.json({ ok: true })
}
