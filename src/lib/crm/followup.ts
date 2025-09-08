export async function triggerFollowUp(localLeadId: string, opts?: { channel?: 'sms' | 'email' }) {
  console.log('[followup] queued', localLeadId, opts?.channel || 'any')
}
