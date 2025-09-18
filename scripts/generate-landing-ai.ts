import { listActiveCities, getLandingData } from '../src/lib/landing/query'
import { getAIDescription } from '../src/lib/landing/ai'

async function main() {
  // Discover top cities from DB (fall back to a small default if DB isn't available)
  let cities: string[] = []
  try {
    const rows = await listActiveCities(50)
    cities = rows.map(r => r.city)
    if (!cities.length) throw new Error('no cities found')
  } catch (e) {
    console.warn('Could not list cities from DB, falling back to default sample cities', e)
    cities = ['san-diego', 'los-angeles', 'san-francisco']
  }

  const kinds: Array<Parameters<typeof getAIDescription>[1]> = [
    'homes-for-sale',
    'condos-for-sale',
    'homes-with-pool',
    'luxury-homes'
  ]

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set — skipping generation')
    return
  }

  // Force regeneration during this run
  process.env.FORCE_AI_REGEN = '1'

  for (const city of cities) {
    for (const kind of kinds) {
      try {
        console.log(`Generating AI description for ${city} - ${kind}`)
        const res = await getAIDescription(city, kind, { forceRegenerate: true })
        console.log(`OK ${city} ${kind}: ${res ? res.slice(0, 80).replace(/\n/g, ' ') : '<no-content>'}`)
      } catch (e: any) {
        console.warn(`Failed ${city} ${kind}:`, e?.message || e)
      }
    }
  }
  console.log('generate-landing-ai complete')
}

main().catch(e => { console.error(e); process.exit(1) })
