import { cookies } from 'next/headers'

// Next.js 15 cookies() is async; support both sync/async (edge/runtime variance)
export function getBucket(): 'A' | 'B' {
  const result: any = cookies() as any
  const maybePromise = result && typeof result.then === 'function'
  if (maybePromise) {
    // If called in an async context, caller should switch to getBucketAsync; fallback to A
    return 'A'
  }
  const store = result
  const existing = store.get('ab_bucket')?.value as 'A' | 'B' | undefined
  if (existing === 'A' || existing === 'B') return existing
  const chosen: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B'
  store.set('ab_bucket', chosen, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return chosen
}

export async function getBucketAsync(): Promise<'A'|'B'> {
  const store: any = await (cookies() as any)
  const existing = store.get('ab_bucket')?.value as 'A' | 'B' | undefined
  if (existing === 'A' || existing === 'B') return existing
  const chosen: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B'
  store.set('ab_bucket', chosen, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return chosen
}
