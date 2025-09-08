import { LeadPayload } from './types'

export function scoreLead(input: LeadPayload): number {
  let s = 0
  if (input.wantsTour) s += 30
  if (input.isCashBuyer) s += 20
  if (input.timeframe === 'now') s += 30
  else if (input.timeframe === '30d') s += 20
  else if (input.timeframe === '90d') s += 10
  const max = input.budgetMax ?? 0
  if (max >= 1_000_000) s += 20
  else if (max >= 500_000) s += 10
  else if (max > 0) s += 5
  if (input.email) s += 5
  if (input.phone) s += 10
  return Math.min(100, s)
}
