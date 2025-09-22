// src/lib/referrals.ts
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const REF_COOKIE = process.env.REFERRAL_COOKIE_NAME || 'ref'
const CC_COOKIE = process.env.CC_SESSION_COOKIE_NAME || 'cc_session'

function serviceClient(){
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service env not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const supa = serviceClient()
  const { data: p, error } = await supa.from('users').select('referral_code').eq('id', userId).maybeSingle()
  if (error) throw error
  if (p?.referral_code) return p.referral_code
  const code = await generateUniqueCode(supa)
  await supa.from('users').update({ referral_code: code }).eq('id', userId)
  return code
}

export async function recordVisit({ refCode, ccSession, path, utm, req }:{ refCode:string; ccSession?:string; path?:string; utm?:Record<string,string>; req?:NextRequest; }){
  if (!refCode) return
  const supa = serviceClient()
  const ip = req?.headers.get('x-forwarded-for') || undefined
  const ua = req?.headers.get('user-agent') || undefined
  await supa.from('referral_visits').insert({
    referrer_code: refCode,
    cc_session: ccSession as any,
    landing_path: path,
    utm: utm ? JSON.stringify(utm) as any : undefined,
    ip: ip as any,
    user_agent: ua,
  })
}

export async function claimReferrerOnSignup({ newUserId, refCookie, ccSession }:{ newUserId:string; refCookie?:string; ccSession?:string; }){
  if (!refCookie) return
  const supa = serviceClient()
  // Resolve referrer by code
  const { data: referrer } = await supa.from('users').select('id').eq('referral_code', refCookie).maybeSingle()
  if (!referrer?.id) return
  // Link only if not already set
  await supa.from('users').update({ referrer_id: referrer.id }).eq('id', newUserId).is('referrer_id', null)
  // Create signup event (idempotent via unique index)
  let evt: any = null
  {
    const { data, error } = await supa.from('referral_events')
      .insert({ referrer_id: referrer.id, referee_id: newUserId, kind: 'signup' })
      .select('*').single()
    if (error && (!String(error.message).toLowerCase().includes('duplicate') && !String(error.code || '').includes('23505'))) {
      // non-dup error: bail silently
    } else if (error) {
      const { data: existing } = await supa.from('referral_events').select('*').eq('referee_id', newUserId).eq('kind','signup').maybeSingle()
      evt = existing
    } else {
      evt = data
    }
  }
  if (evt?.id) {
    await supa.from('referral_rewards').insert({ user_id: referrer.id, event_id: evt.id, points: Number(process.env.REFERRAL_POINTS_SIGNUP||10), reason: 'signup', status: 'pending' })
  }
  if (ccSession) await mergeSessionIntoUser({ userId: newUserId, ccSession })
}

export async function awardForLead({ refereeUserId, refereeSession, refCookie }:{ refereeUserId?:string; refereeSession?:string; refCookie?:string; }){
  if (!refCookie) return
  const supa = serviceClient()
  const { data: referrer } = await supa.from('users').select('id').eq('referral_code', refCookie).maybeSingle()
  if (!referrer?.id) return
  const payload: any = { referrer_id: referrer.id, kind: 'lead' }
  if (refereeUserId) payload.referee_id = refereeUserId; else if (refereeSession) payload.cc_session = refereeSession
  const { data: e } = await supa.from('referral_events').insert(payload).select('*').single()
  if (e?.id) await supa.from('referral_rewards').insert({ user_id: referrer.id, event_id: e.id, points: Number(process.env.REFERRAL_POINTS_LEAD||40), reason: 'lead', status: 'pending' })
}

export async function mergeSessionIntoUser({ userId, ccSession }:{ userId:string; ccSession?:string; }){
  if (!ccSession) return
  const supa = serviceClient()
  // Prefer RPC for atomicity
  await supa.rpc('merge_referral_session', { p_user_id: userId, p_cc_session: ccSession })
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  const admins = (process.env.REFERRAL_ADMIN_EMAILS || '')
    .split(',')
    .map(s=>s.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export function generateCode(): string { return Math.random().toString(36).slice(2, 10).toUpperCase() }

async function generateUniqueCode(supa: any): Promise<string> {
  // Try a few times to avoid rare collision
  for (let i=0;i<8;i++){
    const candidate = generateCode()
    const { data } = await supa.from('users').select('id').eq('referral_code', candidate)
    if (!data || data.length === 0) return candidate
  }
  // Fallback deterministic
  return `${Date.now().toString(36).toUpperCase()}`.slice(-8)
}

export function getCookiesFromRequest(req: NextRequest){
  const raw = req.headers.get('cookie') || ''
  function getCookie(name:string){ const m = raw.match(new RegExp('(?:^|; )'+name+'=([^;]+)')); return m?decodeURIComponent(m[1]):undefined }
  return {
    ref: getCookie(REF_COOKIE),
    cc: getCookie(CC_COOKIE),
  }
}
// (avoid duplicate exported names)
