import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = hasRedis ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null

const windowSec = Number(process.env.RATE_LIMIT_WINDOW || 10)
const qps = Number(process.env.RATE_LIMIT_QPS || 6)

export const limiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(qps, `${windowSec} s`),
  analytics: true,
}) : null

export async function guardRateLimit(key: string) {
  if (!limiter) return { allowed: true, remaining: 999 }
  const r = await limiter.limit(key)
  return { allowed: r.success, remaining: r.remaining }
}
