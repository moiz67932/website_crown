import type { LeadPayload } from './types'

export function toLoftyLead(input: LeadPayload) {
  return {
    firstName: input.firstName ?? input.fullName?.split(' ')?.[0] ?? '',
    lastName: input.lastName ?? input.fullName?.split(' ')?.slice(1).join(' ') ?? '',
    emails: input.email ? [input.email] : [],
    phones: input.phone ? [input.phone] : [],
    streetAddress: input.streetAddress,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    tags: input.tags ?? [],
    source: input.source ?? input.utm_source ?? 'Crown Coastal Homes Website',
    sourceUrl: input.pageUrl,
    notes: input.message,
  }
}
