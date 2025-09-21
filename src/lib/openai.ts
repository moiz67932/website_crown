import OpenAI from "openai"

// Central OpenAI client configured from server env
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export type Block = { role: "system" | "user" | "developer"; content: string }

// Text helper using Responses API; uses max_output_tokens (not max_tokens)
export async function chatText(
  blocks: Block[],
  opts?: { model?: string; max?: number }
) {
  const model = opts?.model ?? (process.env.CHAT_MODEL || "gpt-5-mini")
  const max_output_tokens = opts?.max ?? 650
  const res = await openai.responses.create({
    model,
    // Cast to any to accommodate developer role and simplified Block type
    input: blocks as any,
    max_output_tokens,
  })
  return (res as any).output_text as string
}

// Strict JSON helper. Adds a developer hint to force JSON only.
export async function chatJSON<T = any>(
  blocks: Block[],
  opts?: { model?: string; schemaHint?: string; max?: number }
): Promise<T> {
  const model = opts?.model ?? (process.env.CHAT_MODEL || "gpt-5-mini")
  const max_output_tokens = opts?.max ?? 300
  const hint = opts?.schemaHint
    ? [{ role: "developer", content: `Return ONLY strict JSON. Schema hint: ${opts.schemaHint}` as const }]
    : []
  const res = await openai.responses.create({
    model,
    input: ([...blocks, ...hint] as any),
    max_output_tokens,
  })
  const raw = (res as any).output_text as string
  const text = raw?.trim() || ""

  // Best-effort JSON extraction to tolerate code fences or extra commentary
  const tryParse = (s: string) => {
    try { return JSON.parse(s) } catch { return undefined }
  }

  // 1) Direct parse
  let parsed = tryParse(text)
  if (parsed !== undefined) return parsed as T

  // 2) Strip common code fences
  let cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  parsed = tryParse(cleaned)
  if (parsed !== undefined) return parsed as T

  // 3) Extract first balanced JSON object or array
  const extractBalanced = (s: string, open: string, close: string) => {
    const start = s.indexOf(open)
    if (start === -1) return undefined
    let depth = 0
    for (let i = start; i < s.length; i++) {
      const ch = s[i]
      if (ch === open) depth++
      else if (ch === close) depth--
      if (depth === 0) {
        const candidate = s.slice(start, i + 1)
        const p = tryParse(candidate)
        if (p !== undefined) return p
        break
      }
    }
    return undefined
  }
  parsed = extractBalanced(cleaned, '{', '}')
  if (parsed !== undefined) return parsed as T
  parsed = extractBalanced(cleaned, '[', ']')
  if (parsed !== undefined) return parsed as T

  // 4) If all else fails, throw with snippet for logs
  const snippet = text.slice(0, 180)
  throw new SyntaxError(`Failed to parse JSON from model output. Snippet: ${snippet}`)
}
