// src/lib/referrals.ts
import { supaServer } from '@/lib/supabase'

// New simplified referrals (explicit code entry; signups + leads only)

function serviceClient() { return supaServer() }

// Utilities
function randomCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const supa = serviceClient()
  // Check existing
  const { data: existing } = await supa.from('referral_codes').select('code').eq('user_id', userId).maybeSingle()
  if (existing?.code) return existing.code
  // Loop until unique
  for (let i=0;i<15;i++) {
    const candidate = randomCode()
    const { data: dupe } = await supa.from('referral_codes').select('id').eq('code', candidate)
    if (!dupe || dupe.length === 0) {
      const { error } = await supa.from('referral_codes').insert({ user_id: userId, code: candidate })
      if (!error) return candidate
    }
  }
  // Fallback deterministic (rare)
  const fallback = `${Date.now().toString(36).toUpperCase()}`.slice(-8)
  try { await supa.from('referral_codes').insert({ user_id: userId, code: fallback }) } catch {}
  return fallback
}

export async function recordSignup(referralCode: string, referredUserId: string) {
  if (!referralCode || !referredUserId) return { credited: false }
  const supa = serviceClient()
  // Try insert signup (idempotent via unique constraint)
  const { error } = await supa.from('referral_signups')
    .insert({ referrer_code: referralCode, referred_user_id: referredUserId })
  if (error) {
    if (String(error.code).includes('23505') || /duplicate/i.test(String(error.message))) {
      return { credited: false }
    }
    throw error
  }
  // Increment counter atomically (function defined in migration)
  try { await supa.rpc('increment_referral_signup', { p_code: referralCode }) } catch {}
  return { credited: true }
}

export async function recordLead(referralCode: string, payload: { name?:string; email?:string; phone?:string; propertyId?:string }) {
  if (!referralCode) return
  const supa = serviceClient()
  await supa.from('referral_leads').insert({
    referrer_code: referralCode,
    lead_name: payload.name ?? null,
    lead_email: payload.email ?? null,
    lead_phone: payload.phone ?? null,
    property_id: payload.propertyId ?? null
  })
  try { await supa.rpc('increment_referral_lead', { p_code: referralCode }) } catch {}
}

export async function getMyReferralOverview(userId: string) {
  const supa = serviceClient()
  // Code & counts
  const { data: codeRow } = await supa.from('referral_codes').select('code, signup_count, lead_count').eq('user_id', userId).maybeSingle()
  let code = codeRow?.code
  if (!code) code = await ensureReferralCode(userId)

  // Recent activity
  const [{ data: recentSignups }, { data: recentLeads }] = await Promise.all([
    supa.from('referral_signups').select('referred_user_id, created_at').eq('referrer_code', code).order('created_at', { ascending: false }).limit(10),
    supa.from('referral_leads').select('lead_name, lead_email, lead_phone, property_id, created_at').eq('referrer_code', code).order('created_at', { ascending: false }).limit(10),
  ])

  return {
    code,
    signup_count: codeRow?.signup_count ?? 0,
    lead_count: codeRow?.lead_count ?? 0,
    recent_signups: recentSignups || [],
    recent_leads: recentLeads || []
  }
}

// Simple admin helper retained (may still be useful elsewhere)
export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  const admins = (process.env.REFERRAL_ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

