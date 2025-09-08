import { LandingData, LandingKind, LandingPropertyCard } from '@/types/landing'

// Deterministic pseudo-random generator (simple hash) to keep demo numbers stable per city+kind
function hashInt(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = Math.imul(31, h) + input.charCodeAt(i) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = []
  const used = new Set<number>()
  let i = 0
  while (out.length < Math.min(count, arr.length) && i < 500) {
    const idx = (seed + i * 17) % arr.length
    if (!used.has(idx)) {
      used.add(idx)
      out.push(arr[idx])
    }
    i++
  }
  return out
}

const localImages = [
  '/modern-beach-house.png',
  '/luxury-modern-house-exterior.png',
  '/luxury-master-bedroom.png',
  '/modern-ocean-living.png',
  '/san-diego-bay-sunset.png',
  '/professional-real-estate-agent.png',
  '/california-coastal-sunset.png'
]

interface BuildParams { city: string; kind: LandingKind }

export function buildDemoLandingData({ city, kind }: BuildParams): LandingData {
  const seedBase = `${city.toLowerCase()}-${kind}`
  const seed = hashInt(seedBase)

  // Stats (rough illustrative values only)
  const medianPrice = 600000 + (seed % 400000) // 600k - 1M
  const pricePerSqft = 300 + (seed % 250) // 300 - 550
  const daysOnMarket = 15 + (seed % 30)
  const totalActive = 120 + (seed % 80)

  // Featured property cards (dummy)
  const featured: LandingPropertyCard[] = Array.from({ length: 12 }).map((_, i) => {
    const base = seed + i * 97
    const price = medianPrice * (0.7 + (i % 5) * 0.08)
    const beds = 2 + (base % 4)
    const baths = 1 + (base % 3)
    const sqft = 900 + (base % 1800)
    const img = localImages[(base + i) % localImages.length]
    const lat = 33.6 + ((base % 1000) / 1000) * 0.2 // pseudo around Orange County
    const lng = -117.9 + ((base % 1000) / 1000) * 0.2
    return {
      listingKey: `${seedBase}-demo-${i}`,
      title: `${beds} BR ${kind.replace(/-/g, ' ')}`,
      address: `${100 + (base % 8000)} Demo St` ,
      city: capitalize(city),
      state: 'CA',
      price: Math.round(price / 1000) * 1000,
      beds,
      baths,
      sqft,
      img,
      status: 'Active',
      lat,
      lng
    }
  })

  const neighborhoods = pick([
    { name: 'Downtown', url: `/${city}/downtown`, blurb: 'Urban core & dining' },
    { name: 'Westside', url: `/${city}/westside`, blurb: 'Parks & schools' },
    { name: 'Harbor', url: `/${city}/harbor`, blurb: 'Coastal lifestyle' },
    { name: 'Canyon', url: `/${city}/canyon`, blurb: 'Hills & trails' },
    { name: 'Historic District', url: `/${city}/historic`, blurb: 'Period homes' },
    { name: 'Tech Park', url: `/${city}/tech-park`, blurb: 'Modern builds' }
  ], seed, 4)

  const schools = pick([
    { name: `${capitalize(city)} Elementary`, rating: 8, url: '#' },
    { name: `${capitalize(city)} Middle`, rating: 9, url: '#' },
    { name: `${capitalize(city)} High`, rating: 9, url: '#' },
    { name: 'STEM Academy', rating: 10, url: '#' }
  ], seed, 3)

  const trends = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const median = Math.round(medianPrice * (0.85 + i * 0.01))
    return { date: date.toISOString().slice(0, 10), medianPrice: median }
  })

  const faq = [
    { q: 'How competitive is the market?', a: 'Inventory is moderate and well‑priced homes can receive multiple offers. Prep and pricing strategy matter.' },
    { q: 'What is the average days on market?', a: `${daysOnMarket} days based on recent demo data.` },
    { q: 'Can I schedule a tour?', a: 'Yes—contact us and we will arrange private showings for properties matching your criteria.' }
  ]

  const related = [
    { label: `${capitalize(city)} Condos`, href: `/${city}/condos-for-sale` },
    { label: `${capitalize(city)} Homes with Pool`, href: `/${city}/homes-with-pool` },
    { label: `Under 500K`, href: `/${city}/homes-under-500k` }
  ]

  const titleCity = capitalize(city)
  const titleBase = kind.replace(/-/g, ' ')

  const seo = {
    title: `${titleCity} ${titleBase.replace(/\b\w/g, m => m.toUpperCase())} | Demo`,
    description: `Explore ${titleCity} ${titleBase} listings, pricing trends, neighborhoods, and local insights.`,
    aiDescriptionHtml: `<p>This AI-generated overview highlights <em>${titleCity}</em> as a dynamic market blending lifestyle appeal with economic opportunity. Housing types range from entry-level condos to luxury estates. Ongoing infrastructure, innovation sectors, and quality of life indicators continue to attract diverse buyers.</p>`,
    canonical: `/${city}/${kind}`
  }

  return {
    kind,
    city: titleCity,
    state: 'CA',
    amenities: [
      { category: 'Parks & Recreation', items: ['Central Park', 'Waterfront Trail', 'Community Aquatic Center'] },
      { category: 'Shopping & Dining', items: ['Historic Market Hall', 'Riverwalk Retail District', 'Food Hall Collective'] },
      { category: 'Lifestyle', items: ['Weekly Farmers Market', 'Art & Design District', 'Regional Sports Complex'] }
    ],
    transportation: {
      walkScore: 60 + (seed % 25),
      transitScore: 40 + (seed % 35),
      bikeScore: 55 + (seed % 30),
      avgCommuteMins: 18 + (seed % 12),
      majorHighways: ['I-5', 'SR-55', 'SR-73'].slice(0, 2 + (seed % 2)),
      transitOptions: ['Commuter Rail', 'Regional Bus', 'Light Rail'],
      airports: ['International Airport (35 min)', 'Regional Airfield (20 min)']
    },
    weather: {
      climateType: 'Mediterranean',
      avgHighSummerF: 78 + (seed % 4),
      avgLowWinterF: 48 + (seed % 5),
      sunnyDaysPerYear: 260 + (seed % 30),
      annualRainInches: 12 + (seed % 6)
    },
    demographics: {
      population: 150000 + (seed % 500000),
      medianAge: 34 + (seed % 6),
      medianHouseholdIncome: 85000 + (seed % 40000),
      households: 55000 + (seed % 25000),
      educationAttainment: '57% Bachelor+ (est.)'
    },
    economics: {
      unemploymentRatePct: +(3.2 + (seed % 120) / 100).toFixed(1),
      jobGrowth1YrPct: +(1.5 + (seed % 180) / 100).toFixed(1),
      majorIndustries: ['Tech', 'Biotech', 'Tourism', 'Logistics'].slice(0, 3 + (seed % 2)),
      gdpContributionNote: 'Regional hub with diversified sector growth.'
    },
    crime: {
      safetyIndex: 50 + (seed % 40),
      violentCrimePer1k: +(3 + (seed % 40) / 10).toFixed(1),
      propertyCrimePer1k: +(18 + (seed % 120) / 10).toFixed(1),
      comparedToNational: 'Moderate relative to national urban averages'
    },
    businessDirectory: [
      { name: `${titleCity} Roastery`, category: 'Cafe', blurb: 'Local micro-roasted coffee & community workspace', url: '#' },
      { name: 'Harbor Eatery', category: 'Restaurant', blurb: 'Seasonal coastal cuisine & raw bar', url: '#' },
      { name: 'Makers Collective', category: 'Boutique', blurb: 'Artisan goods & design studio', url: '#' }
    ],
    relatedCities: [
      { city: 'Los Angeles', state: 'CA', href: '/los-angeles/homes-for-sale' },
      { city: 'San Diego', state: 'CA', href: '/san-diego/homes-for-sale' },
      { city: 'San Francisco', state: 'CA', href: '/san-francisco/homes-for-sale' }
    ],
    heroImage: localImages[seed % localImages.length],
    introHtml: `<p><strong>${titleCity}</strong> offers a mix of lifestyle, amenities, and value. This demo page showcases how we will structure real data including featured listings, pricing stats, neighborhoods, schools, trends and FAQs.</p>`,
    stats: { medianPrice, pricePerSqft, daysOnMarket, totalActive },
    featured,
    neighborhoods,
    schools,
    trends,
    faq,
    related,
    seo
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
