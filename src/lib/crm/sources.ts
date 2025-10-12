import type { LeadPayload } from './types'

export function normalizeSource(input: {
  pageUrl?: string
  referrer?: string
  utms?: Record<string, string | undefined>
}) {
  const utm_source = input.utms?.utm_source || input.utms?.source
  const utm_medium = input.utms?.utm_medium || input.utms?.medium
  const utm_campaign = input.utms?.utm_campaign || input.utms?.campaign
  const utm_term = input.utms?.utm_term || input.utms?.term
  const utm_content = input.utms?.utm_content || input.utms?.content
  const referrer = input.referrer || ''
  const source = utm_source || 'Crown Coastal Homes Website'
  const sourceUrl = input.pageUrl || ''
  return { utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer, source, sourceUrl }
}

export function applySourceToLead(p: LeadPayload): LeadPayload {
  const norm = normalizeSource({
    pageUrl: p.pageUrl,
    referrer: p.referrer || p.referer,
    utms: {
      utm_source: p.utm_source || (p.source as string | undefined) || undefined,
      utm_medium: p.utm_medium || (p.medium as string | undefined) || undefined,
      utm_campaign: p.utm_campaign || (p.campaign as string | undefined) || undefined,
      utm_term: p.utm_term || (p.term as string | undefined) || undefined,
      utm_content: p.utm_content || (p.content as string | undefined) || undefined,
    },
  })
  return { ...p, ...norm }
}
