import { NextResponse } from 'next/server'

export async function POST() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/cron/publish`, { method: 'POST', headers: { 'x-cron-secret': process.env.CRON_SECRET || '' } })
  const j = await res.json().catch(()=>({}))
  return NextResponse.json(j)
}
