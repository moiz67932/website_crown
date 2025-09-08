import { LeadPayload } from './types'

export interface CRMProvider {
  pushLead(lead: LeadPayload): Promise<{ id: string; raw?: any }>
  verifyWebhookSignature?(payload: string, signature: string | null): boolean
}

export function createCRM(): CRMProvider {
  const name = process.env.CRM_PROVIDER || 'lofty'
  if (name === 'lofty') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./providers/lofty').loftyProvider()
  }
  throw new Error(`Unsupported CRM_PROVIDER: ${name}`)
}
