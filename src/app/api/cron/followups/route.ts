import { NextRequest, NextResponse } from 'next/server'
import { supaServer } from '@/lib/supabase'
import { dueFollowups, followupTemplate } from '@/lib/crm/followups'
import { sendLeadEmail } from '@/lib/crm/email'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const supa = supaServer()
  const { data, error } = await supa
    .from('leads')
    .select('id,email,first_name,last_name,city,state,county,property_id,page_url,score,assigned_agent,followup_state')
    .not('followup_state', 'is', null)
    .limit(200)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  let sent = 0
  for (const row of data || []) {
    const state = row.followup_state as any
    if (!state?.scheduled?.length) continue
    const { due, remaining } = dueFollowups(state)
    if (!due.length) continue
    for (const f of due) {
      try {
        const payload = {
          email: row.email ?? undefined,
          firstName: row.first_name ?? undefined,
          lastName: row.last_name ?? undefined,
          city: row.city ?? undefined,
          state: row.state ?? undefined,
          county: row.county ?? undefined,
          propertyId: row.property_id ?? undefined,
          pageUrl: row.page_url ?? undefined,
          score: row.score ?? 0,
          assignedAgent: row.assigned_agent ?? undefined,
        } as any
        const { subject, text } = followupTemplate(f.type, payload)
        const to = payload.email || process.env.EMAIL_TO || ''
        if (to) {
          await sendLeadEmail(to, { ...payload, message: text })
          sent++
        }
        const newState = {
          scheduled: remaining,
          sent: [...(state.sent || []), { type: f.type, at: new Date().toISOString() }],
        }
        await supa.from('leads').update({ followup_state: newState }).eq('id', row.id)
      } catch (e: any) {
        console.error('[cron.followups] send error', e?.message || e)
      }
    }
  }
  return NextResponse.json({ ok: true, sent })
}
