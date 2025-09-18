import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Query = z.object({
  city: z.string().min(2),
  niche: z.string().min(2)
})

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const input = Query.parse({ city: url.searchParams.get('city') || '', niche: url.searchParams.get('niche') || '' })

    // google-trends-api must run on server; import dynamically
    let trends: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      trends = require('google-trends-api')
    } catch (e) {
      return NextResponse.json({ ideas: [] })
    }

    const geo = undefined // optional: map city to geo code if you have one
    const related = await trends.relatedQueries({ keyword: `${input.niche} ${input.city}`, geo }).catch(() => null)
    const ideas: { title: string; keywords: string[]; source: string }[] = []
    const buckets: any[] = related?.default?.rankedList?.[0]?.rankedKeyword || []
    for (const b of buckets.slice(0, 10)) {
      ideas.push({ title: b.query, keywords: [b.query, input.city, input.niche], source: 'google-trends' })
    }

    // Optional PAA via Serper.dev guarded by env
    let paa: any[] = []
    if (process.env.SERPER_API_KEY) {
      // placeholder hook; don't fail if missing
      paa = []
    }

    return NextResponse.json({ ideas, paa })
  } catch (e: any) {
    return NextResponse.json({ ideas: [], error: e.message }, { status: 400 })
  }
}
