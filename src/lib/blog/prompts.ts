import type { CityContext } from './context'

export function buildSystemPrompt() {
  return `You are a senior real-estate copywriter and SEO editor for "Crown Coastal Homes".\nSTRICT RULES:\n- Use only facts from provided context. If unknown, SKIP silently. No invented numbers, ratings, commute times, or company presence.\n- Tone: advisory, authoritative, approachable, conversion-oriented.\n- One H1 only. Use H2/H3 properly.\n- Write clean HTML-ready paragraphs (allow <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>).\n- Optimize for intent, not keyword stuffing. Natural density.\n- Cities: California only (from input). Respect nearby cities list as given; do not add unverified places.\n- Output MUST be valid JSON per the response schema.`
}

export function buildUserPrompt(input: any, ctx: CityContext, blurbs: any) {
  const nearby = (input.nearby ?? []).join(', ')
  const sharedRules = `STRICT OUTPUT ORDER:\n1) metaTitle\n2) metaDescription (<=155 chars + CTA)\n3) h1 (primary intent)\n4) sections[]: H2/H3 segments per type below\n5) faqs[10] (distinct, locally relevant, 3–5 sentences each; skip unverifiable topics)\n6) cta (strong, brand-aligned)\n7) jsonLd (one consolidated block: FAQPage, LocalBusiness[Crown Coastal Homes, city], BreadcrumbList, WebPage; OMIT Place/Geo unless coords provided)\nAlso return titleVariantA and titleVariantB for A/B testing (distinct but accurate).\n\nCONTEXT (facts only):\n- City: ${ctx.city}\n- Neighborhoods: ${ctx.neighborhoods.slice(0,20).join(', ')}\n- Property Types: ${ctx.property_types.join(', ')}\n- Example Listings (titles): ${ctx.example_listings.map(x=>x.title).join(' | ')}\n- Nearby Cities (from input): ${nearby || '(none provided)'}\n- Retrieved blurbs: ${JSON.stringify(blurbs).slice(0,3000)}`

  const typeBlock = (() => {
    switch (input.type) {
      case 'top10': return `TYPE: "Top 10 Neighborhoods to Buy in ${ctx.city}"`;
      case 'moving': return `TYPE: "Moving to ${ctx.city}: Complete Guide"`;
      case 'predictions': return `TYPE: "${ctx.city} Real Estate Market Predictions"`;
      case 'schools': return `TYPE: "Best Schools in ${ctx.city}" (QUALITATIVE ONLY)`;
      case 'why_demographic': return `TYPE: "Why ${ctx.city} is Perfect for ${input.options?.demographic || '[Demographic]'}"`;
      default: return ''
    }
  })()

  return `Generate a blog for Crown Coastal Homes using the following instructions.\n\n${sharedRules}\n\n${typeBlock}`
}
