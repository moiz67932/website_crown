import { CRMProvider } from '../provider'
import { LeadPayload } from '../types'

const BASE = process.env.LOFTY_API_BASE || 'https://api.lofty.com/v1'
const KEY = process.env.LOFTY_API_KEY || ''

function mapToLofty(lead: LeadPayload) {
  return {
    first_name: lead.firstName ?? lead.fullName?.split(' ')?.[0] ?? '',
    last_name: lead.lastName ?? lead.fullName?.split(' ')?.slice(1).join(' ') ?? '',
    email: lead.email || '',
    phone: lead.phone || '',
    message: lead.message || '',
    source: lead.source || 'website',
    tags: lead.tags || [],
    city: lead.city || '',
    state: lead.state || '',
    county: lead.county || '',
    budget_min: lead.budgetMin ?? null,
    budget_max: lead.budgetMax ?? null,
    beds: typeof lead.beds === 'string' ? lead.beds : lead.beds ?? null,
    baths: typeof lead.baths === 'string' ? lead.baths : lead.baths ?? null,
    property_type: lead.propertyType || null,
    utm_source: lead.source ?? null,
    utm_medium: lead.medium ?? null,
    utm_campaign: lead.campaign ?? null,
    utm_content: lead.content ?? null,
    utm_term: lead.term ?? null,
    gclid: lead.gclid ?? null,
    fbclid: lead.fbclid ?? null,
    page_url: lead.pageUrl ?? null,
    referer: lead.referer ?? null,
    user_agent: lead.userAgent ?? null,
    ip: lead.ip ?? null,
    score: lead.score ?? null,
  }
}

export function loftyProvider(): CRMProvider {
  return {
    async pushLead(lead: LeadPayload) {
      if (!KEY) throw new Error('Missing LOFTY_API_KEY')
      const mapped = mapToLofty(lead)
      const r = await fetch(`${BASE}/leads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mapped)
      })
      if (!r.ok) {
        const text = await r.text()
        throw new Error(`Lofty push failed: ${r.status} ${text}`)
      }
      const json: any = await r.json().catch(() => ({}))
      return { id: String(json?.id ?? json?.lead?.id ?? 'unknown'), raw: json }
    },
    verifyWebhookSignature(_payload: string, _signature: string | null) {
      return true
    }
  }
}
