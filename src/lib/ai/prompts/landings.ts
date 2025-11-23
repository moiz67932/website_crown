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

  ai_city_condos_for_sale: (city, county, region, nearby) => `You are an expert real estate copywriter creating a comprehensive, SEO-optimized landing page about CONDOS FOR SALE in ${city} for Crown Coastal Homes.

**CRITICAL REQUIREMENTS:**
- Generate MINIMUM 1,500 words of unique, engaging content
- NO repetitive phrases or filler text
- Each paragraph must be 100-150 words with unique information
- Use natural, human-like writing with varied sentence structure
- Include specific local details about ${city} whenever possible

**Parameters:**
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "condos for sale in ${city}", "${city} condos", "${city} condo market"

**REQUIRED CONTENT STRUCTURE (HTML Format):**

<h2>Introduction to ${city} Condos</h2>
<p>[150-200 words introducing the ${city} condo market. Discuss what makes ${city} attractive for condo buyers - urban lifestyle, maintenance-free living, access to amenities. Mention the diversity of condo options from high-rise luxury to mid-rise urban buildings. DO NOT use generic phrases like "offers a range of options" - be specific about what buyers actually find in ${city}.]</p>

<h2>The ${city} Condo Market Landscape</h2>
<p>[200-250 words describing the current condo market in ${city}. Discuss popular neighborhoods where condos are concentrated (downtown, waterfront, urban cores). Mention typical architectural styles (modern high-rises, converted lofts, mid-century buildings). Talk about the variety of price points and what buyers get at different levels. Be specific about ${city}'s unique condo characteristics.]</p>

<h2>Lifestyle Benefits of Condo Living in ${city}</h2>
<p>[200-250 words on lifestyle advantages. Cover low-maintenance living, security features, community amenities (fitness centers, pools, social spaces). Discuss the appeal for different buyer types: young professionals who travel, downsizers seeking convenience, investors. Mention walkability to ${city}'s attractions, dining, and entertainment. Talk about the lock-and-leave lifestyle.]</p>

<h2>Popular Condo Neighborhoods in ${city}</h2>
<p>[250-300 words detailing specific areas. Name 4-5 actual neighborhoods or districts in ${city} where condos are popular. For each area, describe: the neighborhood character, typical condo styles, proximity to employment/entertainment, transportation access, and what type of buyers are attracted there. Be specific about ${city}'s geography.]</p>

<h2>Understanding Condo Ownership</h2>
<p>[200-250 words on the practical aspects of condo ownership. Explain HOA fees and what they typically cover (building insurance, maintenance, amenities). Discuss how condo ownership differs from single-family homes - shared walls, common areas, CC&Rs. Cover the benefits of collective maintenance and the trade-offs of less autonomy. DO NOT invent specific HOA amounts.]</p>

<h2>Investment Potential</h2>
<p>[150-200 words on condos as investments in ${city}. Discuss rental market appeal, appreciation potential in urban markets, lower entry costs compared to houses. Mention considerations like HOA rental restrictions, tenant screening through management. Talk about ${city}'s economic drivers that support rental demand.]</p>

<h2>Transportation & Connectivity</h2>
<p>[150-200 words on how ${city} condos connect to the region. Discuss walkability scores in urban condo neighborhoods, public transit access, bike lanes. Mention proximity to major highways for car commuters. Name nearby cities (${nearby.join(', ')}) and typical commute times. Talk about how condo locations often prioritize convenience.]</p>

<h2>Working with Crown Coastal Homes</h2>
<p>[200-250 words on why buyers should work with Crown Coastal Homes for their ${city} condo search. Introduce Reza Barghlameno (DRE 02211952) as a local expert. Explain the concierge approach: personalized property tours, understanding of building differences, insights on HOA health, connection to lenders familiar with condo financing. Emphasize knowledge of ${city}'s condo inventory.]</p>

<h2>Express Service Advantages</h2>
<p>[150-200 words on Crown Coastal's Express Service. Detail rapid response times, instant property alerts when new condos hit the market, quick tour scheduling, and streamlined offer process. In competitive ${city} markets, speed matters. Mention mobile app access, document signing convenience, and direct agent access.]</p>

<h2>Ready to Find Your ${city} Condo?</h2>
<p>[150-200 words closing with a clear call-to-action. Encourage readers to browse current listings, schedule a consultation with Reza, or sign up for property alerts. Emphasize the benefits of working with local experts who know ${city}'s condo buildings inside and out. Mention flexible showing schedules and no-obligation consultations.]</p>

**QUALITY STANDARDS:**
- Every paragraph must provide NEW information - no repetition
- Use varied vocabulary and sentence structures
- Include transition sentences between sections
- Make it sound like a knowledgeable human wrote it
- Focus on buyer decision-making factors
- NO phrases like "On neighborhood character" or "buyers should consider"
- Be conversational but professional

Generate the complete HTML content following this structure exactly. Each section should flow naturally into the next.
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

  ai_city_homes_under_500k: (city, county, region, nearby) => `You are an expert real estate copywriter creating a comprehensive, SEO-optimized landing page about HOMES UNDER $500K in ${city} for Crown Coastal Homes.

**CRITICAL REQUIREMENTS:**
- Generate MINIMUM 1,500 words of unique, engaging content
- NO repetitive phrases or filler text
- Each paragraph must be 100-150 words with unique information
- Use natural, human-like writing with varied sentence structure
- Include specific local details about ${city} whenever possible
- AVOID phrases like "Los Angeles offers a range of options" or "buyers should consider"
- Each section must provide NEW and DIFFERENT information

**Parameters:**
- City: ${city}
- County: ${county}
- Region: ${region}
- Nearby Cities: ${nearby.join(', ')}
- Focus Keywords: "homes under 500k ${city}", "affordable homes ${city}", "${city} real estate under 500k"

**REQUIRED CONTENT STRUCTURE (HTML Format):**

<h2>Finding Affordable Homes in ${city}</h2>
<p>[150-200 words introducing the under-$500k market segment in ${city}. Discuss what this budget typically means in ${city} - whether it's condos, townhomes, fixer-uppers, or entry-level single-family homes. Explain how ${city}'s market compares to nearby areas. Set realistic expectations about what buyers can find at this price point without being discouraging. Mention the types of buyers who succeed in this segment: first-timers, investors, downsizers. Be specific about ${city}'s market characteristics.]</p>

<h2>What Your Budget Gets You in ${city}</h2>
<p>[200-250 words detailing the actual types of properties available under $500k in ${city}. Discuss square footage ranges, typical property types (condos vs townhomes vs houses), age of construction, and condition. Talk about neighborhoods or areas where this price point is realistic. Mention trade-offs: older homes vs smaller new construction, location vs size, move-in ready vs renovation opportunities. Discuss lot sizes, parking situations, and common features. Be honest about what's competitive and what buyers might need to compromise on. Include context about ${city}'s housing stock at this price level.]</p>

<h2>Best Neighborhoods for Value Buyers</h2>
<p>[250-300 words identifying specific areas in ${city} where under-$500k homes are more common. Describe the character of these neighborhoods: are they established residential areas, up-and-coming districts, suburban pockets, or urban condos? Discuss what makes each area attractive: proximity to employment centers, schools, transit, shopping, parks. Mention commute times to major job centers. Talk about the lifestyle each area supports and which buyer types are drawn there. Include information about walkability, safety, schools, and amenities. Connect to ${city}'s geography and how different districts offer different value propositions.]</p>

<h2>Financing and Affordability Strategies</h2>
<p>[200-250 words on practical financing approaches for this price point. Discuss conventional loans, FHA loans for lower down payments, first-time buyer programs, and potential local assistance programs in ${city} or ${county}. Explain the importance of getting pre-approved before house hunting. Mention typical down payment expectations, closing costs, and ongoing ownership costs (property taxes, HOA fees, insurance, maintenance). Discuss how buyers can strengthen their offers without overpaying. Address common concerns about competing with investors or cash buyers. Provide realistic guidance on monthly payment expectations and qualifying income levels.]</p>

<h2>Renovation Potential and Building Equity</h2>
<p>[150-200 words on the opportunity side of buying at this price point. Discuss how cosmetic updates can add value, which improvements offer the best return, and how sweat equity works. Mention the difference between cosmetic fixes and structural issues. Talk about permit requirements in ${city}, contractor selection, and budgeting for improvements. Explain how buying below your max budget leaves room for upgrades. Discuss long-term appreciation potential in ${city}'s market and how entry-level properties can be stepping stones to wealth building. Emphasize the difference between a smart fixer-upper and a money pit.]</p>

<h2>The Buying Process for Budget-Conscious Buyers</h2>
<p>[200-250 words walking through the practical steps. Discuss the importance of being ready to move quickly in competitive segments. Explain how to prioritize must-haves vs nice-to-haves. Cover the role of home inspections, negotiating repairs, and protecting yourself while staying competitive. Discuss strategies for winning offers: escalation clauses, flexible closing dates, pre-inspection. Mention the value of local expertise in identifying good deals before they hit the market. Talk about timing: seasonal patterns, how long homes sit, and when to expect less competition. Include realistic timelines from search to close.]</p>

<h2>Hidden Costs and Long-Term Planning</h2>
<p>[150-200 words on the total cost of ownership. Beyond the purchase price, discuss property taxes in ${city}${county ? ' and ' + county : ''}, homeowners insurance, HOA fees for condos/townhomes, utilities, and maintenance reserves. Explain how these costs vary by property type and location within ${city}. Discuss building an emergency fund for unexpected repairs. Mention resale considerations: which improvements add value, how long to plan to stay to recoup transaction costs, and market timing. Help buyers think beyond the initial purchase to long-term financial health.]</p>

<h2>Working with Crown Coastal Homes</h2>
<p>[200-250 words on why buyers should work with Crown Coastal Homes for their ${city} under-$500k home search. Introduce Reza Barghlameno (DRE 02211952) as a local expert who understands value segments and knows where to find the best deals. Explain the concierge approach: personalized property tours, off-market opportunities, insights on neighborhood value, connections to lenders who specialize in first-time buyer programs. Emphasize knowledge of ${city}'s micro-markets and which areas offer the best long-term value. Discuss negotiation expertise that helps buyers compete effectively without overpaying. Mention access to contractor networks for pre-purchase estimates on renovations.]</p>

<h2>Express Service for Time-Sensitive Opportunities</h2>
<p>[150-200 words on Crown Coastal's Express Service. Detail rapid response times, instant property alerts when new listings under $500k hit the market, same-day tour scheduling, and streamlined offer process. Explain how in competitive ${city} markets, speed can make the difference between winning and losing a property. Mention mobile app access, electronic document signing, and direct agent access. Emphasize that Express Service gives budget-conscious buyers the same advantages that luxury buyers expect: immediate information, quick decisions, and professional representation that moves at your pace.]</p>

<h2>Ready to Find Your ${city} Home Under $500k?</h2>
<p>[150-200 words closing with a clear call-to-action. Encourage readers to browse current listings, schedule a consultation with Reza, or sign up for property alerts. Emphasize the benefits of working with local experts who know ${city}'s affordable inventory inside and out. Mention flexible showing schedules, no-obligation consultations, and personalized search strategies. Reassure buyers that finding quality homes under $500k is possible with the right guidance and patience. Close with an invitation to start the journey toward homeownership in ${city}.]</p>

**QUALITY STANDARDS:**
- Every paragraph must provide NEW information - absolutely no repetition
- Use varied vocabulary and sentence structures throughout
- Include natural transition sentences between sections
- Make it sound like a knowledgeable human expert wrote it
- Focus on practical buyer decision-making factors
- NO generic phrases or template language
- Be conversational but professional and authoritative
- Each section should flow naturally into the next

Generate the complete HTML content following this structure exactly. Make every paragraph unique and valuable.
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
