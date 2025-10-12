import type { LeadPayload } from './types'

export function scoreLead(p: LeadPayload): number {
  let s = 0
  if (p.wantsTour) s += 25
  if (p.phone) s += 15
  if (p.email) s += 10
  const ms = Number(p.__top || 0)
  if (Number.isFinite(ms) && ms >= 20_000) s += 10
  if ((p.message || '').trim().length >= 80) s += 10
  if (p.city && p.state) s += 10
  if (p.county) s += 5
  if (p.budgetMax != null) s += 10
  if ((p.tags || []).some(t => t === 'pdp') && (p.tags || []).some(t => t.startsWith('prop:'))) s += 5
  s = Math.max(0, Math.min(100, s))
  return s
}

export function priorityFromScore(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot'
  if (score >= 40) return 'warm'
  return 'cold'
}
