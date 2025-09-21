import { chatText } from "./openai"
import { createClient } from "@supabase/supabase-js"

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false } }
  )
}

// Ensure a chat session exists and has a 24h expiry window.
// Decision: we use upsert to make this idempotent and safe to call per request.
export async function ensureSession(session_id: string, lang = "en") {
  await admin()
    .from("chat_sessions")
    .upsert({
      id: session_id,
      lang,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .throwOnError()
}

export async function logTurn(session_id: string, role: "user" | "assistant", content: string) {
  await admin().from("chat_messages").insert({ session_id, role, content })
}

export async function summarizeIfNeeded(session_id: string) {
  const db = admin()
  const { data: msgs } = await db
    .from("chat_messages")
    .select("role,content")
    .eq("session_id", session_id)
    .order("id", { ascending: true })
    .limit(12)

  const transcript = (msgs || []).map((m: any) => `${m.role}: ${m.content}`).join("\n")
  if (!transcript) return
  const sys = "Summarize in 5–8 sentences (goals, preferences, constraints, city, budget, timeline). Output plain text only."
  const summary = await chatText([
    { role: "system", content: sys },
    { role: "user", content: transcript },
  ], { max: 220 })
  await db.from("chat_summaries").upsert({ session_id, summary })
}

/*
Test checklist (lib/memory.ts):
- Call ensureSession('test-1','en') → verify chat_sessions row exists with future expires_at.
- logTurn('test-1','user','hello') → row in chat_messages.
- summarizeIfNeeded('test-1') after a few turns → row in chat_summaries created/updated.
*/
