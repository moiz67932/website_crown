import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { path } = await req.json()
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: false, error: 'path required' }, { status: 400 })
    }
    revalidatePath(path)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
