const BASE = process.env.LOFTY_BASE_URL || 'https://api.lofty.com/v1.0'
const KEY = process.env.LOFTY_API_KEY || ''

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController()
  setTimeout(() => c.abort(), ms).unref?.()
  return c.signal
}

export async function createLoftyLead(loftyBody: any) {
  if (!KEY) throw new Error('Missing LOFTY_API_KEY')
  const url = `${BASE.replace(/\/$/, '')}/leads`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loftyBody),
    signal: timeoutSignal(15_000),
  })
  const text = await res.text().catch(() => '')
  if (!res.ok) {
    throw new Error(`Lofty create lead failed ${res.status}: ${text}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }
}
