import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const { session_id, rating, note } = await req.json()
  // optional table: chat_feedback(session_id uuid, rating int, note text, created_at timestamptz)
  await admin().from("chat_feedback").insert({ session_id, rating, note }).throwOnError()
  return Response.json({ ok: true })
}
