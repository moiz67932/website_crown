import { LeadPayload } from './types'
import { createCRM } from './provider'

type Job = { id: string; attempt: number; lead: LeadPayload }
const MAX_ATTEMPTS = 5
const pending: Job[] = []
let draining = false

export async function enqueueLead(lead: LeadPayload) {
  const job: Job = { id: crypto.randomUUID(), attempt: 0, lead }
  pending.push(job)
  void drain()
}

async function drain() {
  if (draining) return
  draining = true
  while (pending.length) {
    const job = pending.shift()!
    try {
      const crm = createCRM()
      await crm.pushLead(job.lead)
      console.log('[crm.queue] pushed', job.id)
    } catch (e: any) {
      job.attempt += 1
      console.warn('[crm.queue] push failed', job.id, e?.message || e)
      if (job.attempt < MAX_ATTEMPTS) {
        const delay = 1000 * Math.pow(2, job.attempt)
        setTimeout(() => pending.push(job), delay)
      } else {
        console.error('[crm.queue] dead-letter', job.id, job.lead)
      }
    }
  }
  draining = false
}
