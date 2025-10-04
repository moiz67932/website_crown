import OpenAI from "openai"

// Use globalThis to cache across hot reloads / lambda invocations
declare global {
  // eslint-disable-next-line no-var
  var __openai: OpenAI | undefined
  // eslint-disable-next-line no-var
  var __vectorClient: any | undefined // replace `any` with your client type if you wire one
}

export function getOpenAI(): OpenAI {
  if (!globalThis.__openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY")
    globalThis.__openai = new OpenAI({ apiKey })
  }
  return globalThis.__openai
}

// Optional vector client getter. Implement if you have a vector DB.
// Example: return a Qdrant, Supabase, or PgPool singleton.
export function getVectorClient<T = unknown>(): T | null {
  if ((globalThis as any).__vectorClient) return (globalThis as any).__vectorClient as T
  // Lazy init if needed:
  // (globalThis as any).__vectorClient = new YourVectorClient(/* ... */)
  return null
}
