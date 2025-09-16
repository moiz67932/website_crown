export const LANDING_PROMPTS: Record<string, (city: string, county: string, region: string, nearbyCities: string[]) => string> = {
  ai_city_homes_for_sale: (city, county, region, nearby) => `Create a unique, highly SEO-, GEO- and AI-optimized real estate landing page text for the website "Crown Coastal Homes".

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "buy real estate in ${city}", "homes for sale in ${city}", "real estate agent ${city}", "${city} real estate", "${city} housing market"

Strict Rules:
- Use only verifiable facts about ${city}${county ? ', ' + county : ''}, ${region}. If data is not available, omit that portion—do NOT fabricate.
- Do NOT hallucinate statistics, population, price data, school ratings, commute times, or company presence.
- If a data point is unknown, gracefully skip it (do not label as TBD unless essential).
- Keep tone: trustworthy, professional, conversion-focused, locally grounded.
- Incorporate internal branding: Crown Coastal Homes & Reza Barghlameno.
- Include “Express Service” benefits where relevant.
- Use concise paragraphs, scannable bullets, semantic HTML heading logic (H1 once, H2/H3 appropriately), and natural keyword density (no stuffing).
- Optimize for Google (“homes for sale in ${city}”), AI Overviews / SGE, and user conversion.

Output Structure (exact order):
1. Meta Title (include ${city}${county ? ', ' + county : ''}, ${region})
2. Meta Description (<=155 chars, include a focus keyword + CTA)
3. H1 Heading (primary intent phrase)
4. Introduction (150–200 words: market positioning + lifestyle + buyer appeal)
5. Main Content (800–1,000 words) using semantic H2/H3 sections covering:
  - Real Estate Market Overview (pricing ranges if verifiable, inventory tone; skip numbers if uncertain)
  - Buyer Demand & Trends (avoid unverifiable numeric claims; qualitative acceptable)
  - Neighborhood & Area Highlights (list notable neighborhoods if confidently known; else summarize types of areas)
  - Lifestyle & Local Advantages (parks, waterfront, climate, cultural or outdoor appeal—only if factual)
  - Accessibility & Commuting (major highways, transit, airports—only if certain)
  - Nearby Cities & Regional Context (use provided nearby list only)
  - Working with a Local Expert (introduce Crown Coastal Homes & Reza Barghlameno authority)
  - Why Choose Crown Coastal Homes (bullet list)
  - Express Service (outline speed, personalization, negotiation positioning)
6. FAQs (10 distinct, locally relevant Q&A; 3–5 sentence answers; no fabrication—omit topics if unverifiable. Cover: market competitiveness, typical property styles, buying timeline, negotiation climate, financing considerations, popular neighborhoods, first-time buyer tips, relocation considerations, investment appeal, using a local agent.)
7. Strong Call-to-Action (consultation + express service + contact invite)
8. Structured Data (single consolidated JSON-LD block) including:
  - FAQPage (the 10 FAQs)
  - LocalBusiness (Crown Coastal Homes with city & region; omit address if unknown)
  - BreadcrumbList (Home > ${region} > ${city} > Homes for Sale)
  - WebPage
  - (Optional) Place / GeoCoordinates ONLY if latitude/longitude are explicitly provided elsewhere (otherwise omit)

Formatting Requirements:
- Provide clean plaintext / HTML-ready sections (no markdown fences, no extraneous commentary).
- Use only one H1. Use H2/H3 for hierarchy.
- Bullets for benefits / reasons lists.
- Natural language—avoid robotic phrasing or over-optimization.

Quality & Safety:
- Zero hallucinated metrics. Skip unknowns silently.
- Do NOT invent MLS IDs, exact counts, or median prices if not provided.
- Avoid repeating the exact same sentence pattern.

Tone: Advisory, authoritative, approachable, and conversion-oriented.
`,

  ai_city_condos_for_sale: (city, county, region, nearby) => `Create a unique, SEO + AI optimized landing page for "Crown Coastal Homes" focused on CONDOS in ${city}.

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "condos for sale in ${city}", "${city} condos", "buy real estate in ${city}", "real estate agent ${city}", "${city} condo market"

Rules:
- Only factual, verifiable condo-related insights (amenities patterns, lifestyle fit, ownership considerations). No made-up HOA amounts or occupancy stats.
- Skip building names unless widely recognizable and certain.
- Mention typical condo buyer profiles (rightsized living, lock-and-leave, investors) without stereotypes.

Output Structure:
1. Meta Title (include ${city}${county ? ', ' + county : ''}, ${region} + Condos For Sale)
2. Meta Description (<=155 chars with CTA + keyword)
3. H1 (Primary condo intent)
4. Intro (150–200 words: positioning condos vs other housing locally)
5. Main Content (800–1,000 words) covering:
  - Condo Market Snapshot (qualitative; skip unverifiable pricing)
  - Lifestyle & Amenities (gyms, pools, security, low-maintenance)
  - Ownership & HOA Considerations (general—no fabricated fees)
  - Popular/Typical Locations or District Types (urban core, coastal, etc. if relevant)
  - Investment & Rental Appeal (only if generally true for region; omit specifics if unknown)
  - Nearby Connectivity (${nearby.join(', ') || 'regional context'})
  - Working with Crown Coastal Homes & Reza Barghlameno
  - Why Choose Crown Coastal Homes (bulleted)
  - Express Service Advantages
6. 10 Condo-Specific FAQs (HOA, financing, resale factors, maintenance, insurance, pet policies (only if broadly typical), rental potential, first-time buyer tips, new vs resale, agent value)
7. CTA
8. JSON-LD (FAQPage, LocalBusiness, BreadcrumbList, WebPage; omit Place if unknown)

Formatting & Tone: Professional, efficient, reassuring. Avoid jargon overload.
`,

  ai_city_homes_with_pool: (city, county, region, nearby) => `Generate a specialized landing page for HOMES WITH POOL in ${city} for Crown Coastal Homes.

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "homes with pool in ${city}", "${city} pool homes", "homes for sale in ${city}", "buy real estate in ${city}", "real estate agent ${city}"

Rules:
- No invented pool maintenance costs or permitting timelines.
- Discuss suitability (climate, lifestyle, entertaining) ONLY if reasonable for region.
- Emphasize considerations: safety, insurance, upkeep, resale appeal.
- Skip weather/temperature claims unless widely known and certain.

Output Structure:
1. Meta Title (Pool Homes + ${city}${county ? ', ' + county : ''}, ${region})
2. Meta Description (<=155 chars inc. pool + CTA)
3. H1
4. Intro (150–200 words: why pool homes appeal locally)
5. Main Content (800–1,000 words):
  - Market Positioning of Pool Homes
  - Buyer Motivations & Lifestyle
  - Ownership & Maintenance Considerations (qualitative only)
  - Safety & Value Retention
  - Locational Factors (microclimates / neighborhoods if factual or skip)
  - Nearby Cities Context (${nearby.join(', ') || 'regional context'})
  - Working with Crown Coastal Homes & Reza Barghlameno
  - Why Choose Crown Coastal Homes (bulleted)
  - Express Service (fast matching & negotiation)
6. 10 Pool-Home FAQs (insurance, resale, maintenance scheduling, heating options, financing nuances, safety features, inspection focus, seasonal demand, cost-benefit, agent role)
7. CTA
8. JSON-LD (FAQPage, LocalBusiness, BreadcrumbList, WebPage)

Tone: Practical, lifestyle-aligned, consultative.
`,

  ai_city_luxury_homes: (city, county, region, nearby) => `Produce a luxury real estate landing page for ${city} focused on UPPER-TIER HOMES.

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "luxury homes in ${city}", "luxury real estate ${city}", "high end homes ${city}", "buy real estate in ${city}", "real estate agent ${city}"

Rules:
- NO fabricated average prices, luxury thresholds, or celebrity references.
- Discuss qualitative differentiators: architecture styles (only if broadly accurate), privacy, lot size, view potential, craftsmanship.
- Avoid overused hype; stress discernment, advisory expertise, and negotiation positioning.

Output Structure:
1. Meta Title (Luxury Homes ${city}${county ? ', ' + county : ''}, ${region})
2. Meta Description (<=155 chars with luxury keyword + CTA)
3. H1
4. Intro (position luxury segment & buyer aims)
5. Main Content (800–1,000 words):
  - Luxury Market Positioning (qualitative supply/demand)
  - Property Characteristics (materials, design ethos—only if safe)
  - Lifestyle & Prestige Drivers
  - Discretion & Representation (importance of expert agent)
  - Area / Estate Pockets (general descriptors if specific neighborhoods uncertain)
  - Regional Connectivity & Executive Appeal (${nearby.join(', ') || 'regional context'})
  - Crown Coastal Homes & Reza Barghlameno (advisory strength)
  - Why Choose Crown Coastal Homes (bullets)
  - Express Service (efficiency & confidentiality)
6. 10 Luxury FAQs (off-market opportunities, negotiation nuance, due diligence, customization potential, time-on-market factors, inspection scope, appraisal complexity, portfolio diversification, privacy concerns, selecting a luxury agent)
7. CTA
8. JSON-LD (FAQPage, LocalBusiness, BreadcrumbList, WebPage)

Tone: Elevated, discreet, advisory—not flashy.
`,

  ai_city_homes_under_500k: (city, county, region, nearby) => `Create an affordability-focused landing page for entry-level & value-conscious buyers in ${city}.

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "homes under 500k ${city}", "affordable homes ${city}", "buy real estate in ${city}", "homes for sale in ${city}", "real estate agent ${city}"

Rules:
- DO NOT claim specific price medians or inventory counts.
- Frame expectations: trade-offs (age, size, location, renovation potential) without exaggeration.
- Include financing readiness & strategy (pre-approval, comparables) generically.

Output Structure:
1. Meta Title (Homes Under $500K ${city}${county ? ', ' + county : ''}, ${region})
2. Meta Description (<=155 chars with affordability + CTA)
3. H1
4. Intro (entry-level orientation)
5. Main Content (800–1,000 words):
  - Segment Overview (value positioning)
  - Typical Property Characteristics (if safely generalizable)
  - Renovation & Equity Potential
  - Financing & Offer Strategy (generic best practices)
  - Nearby Alternatives / Commuter Trade-offs (${nearby.join(', ') || 'regional'})
  - Working with Crown Coastal Homes & Reza Barghlameno
  - Why Choose Crown Coastal Homes (bulleted)
  - Express Service (speed + clarity for first-time buyers)
6. 10 Affordable Segment FAQs (financing prep, offer competitiveness, inspection focus, renovation budgeting, resale trajectory, HOA considerations (if condo/townhome), timing, contingencies, down payment strategy, choosing an agent)
7. CTA
8. JSON-LD (FAQPage, LocalBusiness, BreadcrumbList, WebPage)

Tone: Supportive, empowering, realistic.
`,

  ai_city_homes_over_1m: (city, county, region, nearby) => `Generate a high-value property segment page for ${city} focusing on HOMES OVER $1M.

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "homes over 1m ${city}", "million dollar homes ${city}", "luxury homes in ${city}", "buy real estate in ${city}", "real estate agent ${city}"

Rules:
- Do not assign unverifiable numeric thresholds beyond the $1M framing.
- Emphasize qualitative differentiators: space, finishes, location advantages.
- Avoid fabricated sales velocity or appreciation rates.

Output Structure:
1. Meta Title (Homes Over $1M ${city}${county ? ', ' + county : ''}, ${region})
2. Meta Description (<=155 chars with keyword + CTA)
3. H1
4. Intro (position segment & buyer motivations)
5. Main Content (800–1,000 words):
  - Segment Overview vs Broader Market
  - Property Feature Themes
  - Location & Lifestyle Edge
  - Nearby Executive / Lifestyle Anchors (${nearby.join(', ') || 'regional context'})
  - Representation & Strategy (importance of expert agent)
  - Crown Coastal Homes & Reza Barghlameno
  - Why Choose Crown Coastal Homes (bulleted)
  - Express Service (speed + negotiation sophistication)
6. 10 Segment FAQs (appraisals above $1M, jumbo financing nuances, negotiation leverage, inspection priorities, custom features, portfolio diversification, market timing, staging impact, privacy concerns, agent selection)
7. CTA
8. JSON-LD (FAQPage, LocalBusiness, BreadcrumbList, WebPage)

Tone: Professional, strategic, refined.
`,

  ai_city_2_bed_apartments: (city, county, region, nearby) => `Create a landing page targeting 2-BEDROOM APARTMENTS in ${city} for Crown Coastal Homes.

Parameters:
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "2 bedroom apartments ${city}", "two bedroom condos ${city}", "buy real estate in ${city}", "homes for sale in ${city}", "real estate agent ${city}"

Rules:
- Do not fabricate rental yields, absorption rates, or average HOA costs.
- Frame suitability for small families, remote workers, roommates, rightsizers.
- Mention flexibility (space planning, potential guest/office room) without overpromising.

Output Structure:
1. Meta Title (2-Bedroom Apartments ${city}${county ? ', ' + county : ''}, ${region})
2. Meta Description (<=155 chars with keyword + CTA)
3. H1
4. Intro (150–200 words: positioning 2BR layout advantages)
5. Main Content (800–1,000 words):
  - Segment Overview
  - Layout & Space Utility
  - Lifestyle Fit (remote work, flex room, guests)
  - Ownership & Maintenance (if condo/apt typical)
  - Nearby Urban / Suburban Access (${nearby.join(', ') || 'regional context'})
  - Investment & Resale Considerations (only qualitative)
  - Crown Coastal Homes & Reza Barghlameno
  - Why Choose Crown Coastal Homes (bulleted)
  - Express Service (matching speed)
6. 10 Segment FAQs (layout versatility, resale appeal, financing basics, HOA considerations, sound/privacy, remote work suitability, storage solutions, first-time buyer concerns, investment logic, agent value)
7. CTA
8. JSON-LD (FAQPage, LocalBusiness, BreadcrumbList, WebPage)

Tone: Practical, opportunity-focused, supportive.
`

  , ai_city_faqs: (city, county, region, nearby) => `You are an SEO-focused real estate content writer.
Create a *unique FAQ section* for the ${city}${county ? ", " + county : ""}${region ? ", " + region : ""} landing page of Crown Coastal Homes.

### Core Instructions:
1. Generate *10 FAQs (Question + Answer)*.
   - Long Answer: 150–250 words (on-page content).
   - Short Answer: 50–80 words (for FAQ JSON-LD schema).
   - Make answers *locally specific*: highlight neighborhoods, schools, universities, airports, transit, attractions, housing trends, lifestyle.
   - Use nearby/regional context where helpful: ${nearby && nearby.length ? nearby.join(', ') : 'N/A'}.
   - Position *Crown Coastal Homes* as a *concierge-style California real estate service*.
   - Mention *Reza Barghlameno* as Buyer’s Agent or Listing Agent:
     - Include *full license “DRE 02211952” in ~3–4 of the answers only*.
     - In others, just use his name or “our trusted Buyer’s Agent / Listing Agent.”
   - Vary phrasing to avoid repetition (e.g. “property market,” “housing values,” “real estate trends”).
   - Include *soft calls-to-action* like:
     - “Contact Crown Coastal Homes today”
     - “Schedule a consultation with Reza”
     - “Work with our concierge team”

2. Output Format:
   ### Part A: FAQ Section (Markdown, long answers)
   - Format:
     *Q1: [Question]*
     A1: [Answer ~150–250 words]

   ### Part B: FAQ Schema (JSON-LD, short answers)
   - Provide all 10 FAQs in valid *FAQPage JSON-LD*.
   - Use shortened versions (50–80 words) for each answer.
   - Wrap inside <script type="application/ld+json">.

3. Content Quality Guidelines:
   - Make answers *self-contained* → they should stand alone if quoted in Google AI Overviews or Perplexity.
   - Balance *practical steps* (e.g. “how to buy,” “what to check in inspections”) with *local insights* (e.g. local schools, nearby universities, closest major airport, transit, notable attractions).
   - Write in a *trustworthy, professional, concierge-level tone*.
   - Ensure every FAQ feels *unique to ${city}* to avoid duplicate content across locations.
   - Avoid generic filler like “As an AI…” or “In general terms…”

4. Extra SEO/AI Optimization:
   - Mix in *semantic variations*:
     - “homes for sale in ${city}”
     - “real estate investment opportunities”
     - “housing market trends”
     - “property values”
   - Add *occasional bullet points or mini-lists* inside answers for scannability.
   - Use *natural entity mentions* (airports, universities, landmarks) to help AI connect your content to ${city}.
`
}
