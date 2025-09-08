import { NextRequest, NextResponse } from 'next/server'
import { createCRM } from '@/lib/crm/provider'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get('x-lofty-signature')
  const crm = createCRM()
  if (crm.verifyWebhookSignature && !crm.verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }
  try {
    const evt = JSON.parse(raw)
    console.log('[lofty.webhook]', evt?.type || 'event')
  } catch {
    // swallow parse errors
  }
  return NextResponse.json({ ok: true })
}
