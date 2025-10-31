import { getOpenAI } from "@/lib/openai"

export const runtime = "edge"

// OpenAI TTS replacement for ElevenLabs. We use gpt-4o-mini-tts and return MP3 bytes.
export async function POST(req: Request) {
  const { text, voice = "alloy" } = await req.json()
  if (!text) return new Response(JSON.stringify({ error: "No text" }), { status: 400 })

  const client = getOpenAI()
  const speech: any = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice,
    input: text,
  })

  const arrayBuffer = await speech.arrayBuffer()
  return new Response(Buffer.from(arrayBuffer), {
    headers: { "Content-Type": "audio/mpeg" },
  })
}

/*
Test checklist (api/voice/tts):
- POST {text:"Hello"} → returns audio/mpeg response body.
- Voice param changes (e.g., alloy) work.
- No ElevenLabs envs referenced.
*/
