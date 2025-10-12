import type { FollowupSchedule, LeadPayload } from './types'

export function scheduleDefaultFollowups(now = new Date()): FollowupSchedule {
  const t1h = new Date(now.getTime() + 60 * 60 * 1000)
  const t24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return {
    scheduled: [
      { type: 't1h', at: t1h.toISOString() },
      { type: 't24h', at: t24h.toISOString() },
    ],
    sent: [],
  }
}

export function dueFollowups(s: FollowupSchedule, now = new Date()) {
  const nowIso = now.toISOString()
  const due = s.scheduled.filter((f) => f.at <= nowIso)
  const remaining = s.scheduled.filter((f) => f.at > nowIso)
  return { due, remaining }
}

export function followupTemplate(type: 't1h' | 't24h', lead: LeadPayload) {
  const name = (lead.fullName || lead.firstName || 'there').split(' ')[0]
  if (type === 't1h') {
    return {
      subject: 'Thanks for reaching out — tour availability',
      text: `Hi ${name},\n\nThanks for reaching out about ${lead.propertyId ? 'the property (ID ' + lead.propertyId + ')' : 'homes in the area'}. When would you like to tour? We can usually accommodate within 24–48 hours.\n\nBest,\nCrown Coastal Homes`,
    }
  }
  return {
    subject: 'Still interested? Next steps & comps',
    text: `Hi ${name},\n\nJust checking in — are you still interested? We can prepare comps and next steps for you. Would you like us to send a quick overview?\n\nBest,\nCrown Coastal Homes`,
  }
}
