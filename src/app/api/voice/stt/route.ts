// import { openai } from "@/lib/openai"

// export const runtime = "edge"

// export async function POST(req: Request) {
//   const form = await req.formData()
//   const file = form.get("audio") as File
//   if (!file) return new Response(JSON.stringify({ error: "No file" }), { status: 400 })
//   const tr: any = await openai.audio.transcriptions.create({ model: "whisper-1", file })
//   return Response.json({ text: tr.text || "" })
// }

import { openai } from "@/lib/openai"
import { toFile } from "openai/uploads"

// Force Node runtime (Edge can't reliably handle multipart audio for Whisper)
export const runtime = "nodejs"

// Prefer IPv4 resolution on Node (helps on Windows / some hosts)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dns = require("dns")
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first")
  }
} catch { /* ignore if not available */ }

// Very small chunks lead to bad transcripts and waste requests
const MIN_BYTES = 2048 // ~2 KB

// Map browser mimes to a safe file extension Whisper accepts
function pickExtAndMime(inputMime: string | null | undefined) {
  const mime = (inputMime || "").toLowerCase()
  if (mime.includes("ogg")) return { ext: "ogg", mime: "audio/ogg" }
  if (mime.includes("wav")) return { ext: "wav", mime: "audio/wav" }
  if (mime.includes("mp3") || mime.includes("mpeg") || mime.includes("mpga")) {
    return { ext: "mp3", mime: "audio/mpeg" }
  }
  if (mime.includes("mp4")) return { ext: "mp4", mime: "audio/mp4" }
  if (mime.includes("m4a")) return { ext: "m4a", mime: "audio/m4a" }
  // Default to webm/opus (most browsers when using MediaRecorder)
  return { ext: "webm", mime: "audio/webm" }
}

function isTransient(err: any) {
  const msg = String(err?.message || err || "")
  return /EAI_AGAIN|ETIMEDOUT|ECONNRESET|ENETUNREACH|fetch failed|Connection error/i.test(msg)
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("audio")
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file" }), { status: 400 })
    }
    const lang = (form.get("lang") as string | null) || undefined
    const prompt = (form.get("prompt") as string | null) || undefined

    // Read raw bytes from the uploaded Blob
    const ab = await file.arrayBuffer()
    if (!ab || ab.byteLength < MIN_BYTES) {
      // Too tiny to transcribe — return empty text gracefully
      return Response.json({ text: "" })
    }

    // Pick extension/mime based on what the browser recorded
    const { ext, mime } = pickExtAndMime(file.type)
    const buf = Buffer.from(ab)

    // Wrap with OpenAI helper so the SDK uploads a "real" file object
    const uploadFile = await toFile(buf, `audio.${ext}`, { type: mime })

    // Retry transient network errors a few times
    const MAX_TRIES = 3
    let lastErr: any
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      try {
        const tr: any = await openai.audio.transcriptions.create({
          model: "whisper-1",
          file: uploadFile,
          ...(lang ? { language: lang } : {}),
          ...(prompt ? { prompt } : {}),
          temperature: 0,
        })
        return Response.json({ text: tr.text || "" })
      } catch (e: any) {
        lastErr = e
        if (!isTransient(e) || attempt === MAX_TRIES - 1) {
          console.error("STT error (final):", e)
          return new Response(
            JSON.stringify({ error: e?.message || "server_error" }),
            { status: 500 }
          )
        }
        // exponential backoff with jitter
        const delay = 400 * Math.pow(2, attempt) + Math.random() * 250
        await new Promise((r) => setTimeout(r, delay))
      }
    }

    // Should never reach here
    return new Response(
      JSON.stringify({ error: lastErr?.message || "server_error" }),
      { status: 500 }
    )
  } catch (e: any) {
    console.error("STT error (outer):", e)
    return new Response(
      JSON.stringify({ error: e?.message || "server_error" }),
      { status: 500 }
    )
  }
}
