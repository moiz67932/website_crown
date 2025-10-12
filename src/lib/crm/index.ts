import { z } from 'zod'
import { supaServer } from '@/lib/supabase'
import type { AssignedAgent, FollowupSchedule, LeadPayload } from './types'
import { toLoftyLead } from './mapping'
import { createLoftyLead } from './lofty-client'
import { scoreLead as scoreLeadFn, priorityFromScore } from './scoring'
import { assignAgent } from './assignment'
import { scheduleDefaultFollowups } from './followups'
import { sendLeadEmail } from './email'
import { applySourceToLead } from './sources'

const leadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  county: z.string().optional(),
  streetAddress: z.string().optional(),
  zipCode: z.string().optional(),
  propertyId: z.string().optional(),
  pageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  budgetMax: z.number().optional(),
  timeframe: z.string().optional(),
  wantsTour: z.boolean().optional(),
  __top: z.number().optional(),
  company: z.string().nullable().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  referrer: z.string().optional(),
}).strict()

const MIN_MS_ON_PAGE = 1000

export async function pushLead(payload: any) {
  // Validate & sanitize
  const parsed = leadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid payload' as const, status: 400 }
  }
  let lead: LeadPayload = parsed.data
  if (lead.company) return { ok: true } // honeypot
  if ((lead.__top ?? 0) < MIN_MS_ON_PAGE) {
    return { ok: false, error: 'Bot suspected' as const, status: 202 }
  }
  lead = applySourceToLead(lead)

  // Compute score & assignment
  const score = scoreLeadFn(lead)
  const assignedAgent: AssignedAgent = assignAgent(lead)
  lead.score = score
  lead.assignedAgent = assignedAgent

  // Idempotent upsert into leads
  const supa = supaServer()
  const row = {
    first_name: lead.firstName ?? null,
    last_name: lead.lastName ?? null,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    message: lead.message ?? null,
    city: lead.city ?? null,
    state: lead.state ?? null,
    county: lead.county ?? null,
    property_id: lead.propertyId ?? null,
    page_url: lead.pageUrl ?? null,
    wants_tour: lead.wantsTour ?? null,
    budget_max: lead.budgetMax ?? null,
    timeframe: lead.timeframe ?? null,
    ms_on_page: lead.__top ?? null,
    honeypot: lead.company ?? null,
    utm_source: lead.utm_source ?? null,
    utm_medium: lead.utm_medium ?? null,
    utm_campaign: lead.utm_campaign ?? null,
    utm_term: lead.utm_term ?? null,
    utm_content: lead.utm_content ?? null,
    referrer: lead.referrer ?? null,
    tags: lead.tags ?? [],
    score: score,
    assigned_agent: assignedAgent ? { name: assignedAgent.name, email: assignedAgent.email } : null,
  }
  let upserted: any = null
  try {
    const { data, error } = await supa
      .from('leads')
      .upsert(row, { onConflict: 'email,message,property_id' })
      .select()
      .single()
    if (error) throw error
    upserted = data
  } catch (e: any) {
    console.error('[leads] db upsert error', e?.message || e)
  }

  // Push to Lofty
  let crm: any = null
  let crmError: string | undefined
  const alreadyInCRM = !!upserted?.crm_lead_id
  if (!alreadyInCRM) {
    try {
      const body = toLoftyLead(lead)
      console.info('[leads] lofty.request', body)
      const resp = await createLoftyLead(body)
      console.info('[leads] lofty.response', resp)
      crm = { provider: 'lofty', id: String((resp as any)?.leadId || (resp as any)?.id || '') }
      if (upserted?.id) {
        await supa.from('leads').update({ crm_provider: 'lofty', crm_lead_id: crm.id, crm_status: 'created' }).eq('id', upserted.id)
      }
    } catch (err: any) {
      crmError = err?.message || String(err)
      console.error('[leads] lofty.error', crmError)
      if (upserted?.id) {
        await supa.from('leads').update({ crm_provider: 'lofty', crm_status: 'failed', crm_error: crmError }).eq('id', upserted.id)
      }
    }
  } else {
    crm = { provider: 'lofty', id: upserted.crm_lead_id }
  }

  // Email fallback (always)
  try {
    const to = process.env.EMAIL_TO || 'leads@crowncoastal.com'
    await sendLeadEmail(to, { ...lead, score, assignedAgent })
    console.info('[leads] email.sent')
  } catch (e: any) {
    console.error('[leads] email.error', e?.message || e)
  }

  // Schedule follow-ups
  try {
    const schedule: FollowupSchedule = scheduleDefaultFollowups()
    if (upserted?.id) {
      await supa.from('leads').update({ followup_state: schedule }).eq('id', upserted.id)
    }
  } catch (e: any) {
    console.error('[leads] followup.schedule.error', e?.message || e)
  }

  return { ok: true, crm, score, assignedAgent, crm_error: crmError }
}

export { scoreLeadFn as scoreLead, priorityFromScore }
