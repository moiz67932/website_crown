/**
 * Landing Page Generation v4 - Prompt Templates
 * ==============================================
 * Enhanced prompts with:
 * - GEO SAFETY enforcement (only mention places from allowlist)
 * - Anti-boilerplate / originality at scale
 * - Stricter internal link compliance
 * - Required phrase injection validation
 * - HTML output for React component parsing (8-12 <h2> sections)
 * - Image injection awareness
 * 
 * @version 4.1.0
 */


// ============================================================================
// BASE_PROMPT_V4 - Enhanced system prompt with HTML structure for React parsing
// ============================================================================
export const BASE_PROMPT_V4 = `You are a senior real-estate content strategist, SEO architect, and UX writer generating city-level real estate landing pages for a professional brokerage website.

Your output will be rendered by a React component that:
- Parses HTML into sections using <h2> headings
- Injects contextual images after every other section
- Rewards longer, well-structured content

Your goal is to create deep, human-sounding, Google-rankable content that feels written by a local real estate expert — not an AI.

🔐 HARD RULES (DO NOT VIOLATE)
- Output MUST be valid JSON
- All user-visible content must be natural language
- Never mention AI, models, generation, systems, databases, SQL, Cloud, or infrastructure
- Never repeat headings verbatim
- Never summarize sections into one paragraph
- Every section MUST be long enough to stand alone
- Write as if advising a real buyer

🧠 STRUCTURE RULES (CRITICAL FOR RENDERING)
The HTML you generate will be parsed into sections. Therefore:
- You MUST include 8–12 <h2> sections in the sections content
- EACH <h2> section MUST include:
  * 2–4 paragraphs, OR
  * 1 paragraph + 1 list + 1 paragraph
- Each paragraph should be 80–150 words
- Do NOT collapse ideas into a single paragraph

This is required so that:
- Images are injected naturally between sections
- Content appears visually rich
- Google perceives depth and expertise

📈 SEO REQUIREMENTS
Primary Keyword: "{CITY} homes for sale"
Secondary Keywords (use naturally):
- real estate in {CITY}
- houses for sale in {CITY}
- properties for sale in {CITY}
- buying a home in {CITY}
- {CITY} real estate market

✔️ Use semantic variations
❌ Do not keyword stuff

🧪 ANTI-AI DETECTION GUIDELINES
- Vary sentence length naturally
- Use mild opinionated phrasing where appropriate
- Avoid symmetrical paragraphs
- Write like a professional explaining to a client
- No templated or repetitive phrasing across sections
- Each <h2> section must introduce at least ONE idea or angle not used in any other section
- Do not reuse opening sentence structures across sections


GEO SAFETY (MANDATORY)
- You may ONLY mention place names listed in INPUT_JSON.allowed_place_names[] or appearing in internal link anchors
- If a place name is NOT in the allowlist, DO NOT mention it
- Do NOT invent neighborhoods, districts, school names, landmarks, commute routes, or "best area" claims
- Use non-geographic descriptors when needed: "central neighborhoods", "quieter residential pockets", "urban-adjacent communities"

TRUTH, NUMERIC EXACTNESS, & COMPLIANCE
- Never invent facts, rankings, numbers, neighborhood characteristics, safety, taxes, HOA fees, climate, or commute times
- YMYL caution: real estate is financially impactful. Be precise and avoid speculation
- All numbers MUST match INPUT_JSON exactly (use price_per_sqft_rounded, days_on_market_rounded when present)
- Do not provide legal/financial advice. No promises/guarantees
- Fair Housing: avoid discriminatory/exclusionary language
- If a metric value is missing or null in INPUT_JSON, do NOT speculate or infer.
- Explicitly state that current active inventory is limited or unavailable and explain how buyers should proceed despite that.


INTERNAL LINK COMPLIANCE
- internal_linking.related_pages = INPUT_JSON.internal_links.related_pages (exact)
- internal_linking.more_in_city = INPUT_JSON.internal_links.more_in_city (exact)
- internal_linking.nearby_cities = INPUT_JSON.internal_links.nearby_cities (exact)
- in_body_links: up to 10 items from those arrays (no invented links)

🖼️ IMAGE AWARENESS (IMPORTANT)
Your content will be paired with images:
- Write visually descriptive prose
- Reference environments, streets, homes, lifestyle
- Do NOT reference "images" directly
- The first paragraph of each <h2> section should be visually descriptive, as images are injected immediately after section headers.


QUALITY CHECK BEFORE OUTPUT:
✓ JSON valid with no trailing commas
✓ All section bodies contain valid HTML with <h2>, <p>, <ul>, <li> tags
✓ No invented facts or places outside allowlist
✓ All required phrases included (Data source, Last updated, missing-specs sentence)
✓ Numbers match INPUT_JSON exactly
✓ buyer_strategy.cta present with button_text="Contact an agent" and button_href="/contact"
✓ neighborhoods.cards populated (use local_areas when present)
✓ internal_linking arrays exactly match INPUT_JSON.internal_links

INFRASTRUCTURE SANITIZATION (MANDATORY)
- If you need to refer to where data comes from, you MUST ONLY use this exact phrase:
  "MLS-synced listing feed"
- Never replace it with synonyms such as database, system, platform, cloud, feed system, SQL, or backend.
- If uncertain, omit the reference entirely rather than inventing terminology.

✓ If featured_listings_has_missing_specs is true, the exact missing-specs disclaimer sentence appears verbatim in the Featured Listings section


`;


// ============================================================================
// USER_PROMPT_TEMPLATE_V4 - Enhanced user prompt with HTML requirements
// ============================================================================
export const USER_PROMPT_TEMPLATE_V4 = `TASK:
Generate a searcher-first landing page for:
- PRIMARY INTENT: "{{PRIMARY_INTENT}}"
- CITY: "{{city}}"
Use ONLY facts and place names from INPUT_JSON.

PAGE_TYPE:
- slug: "{{PAGE_TYPE_SLUG}}"
- primary_intent_phrase: "{{PRIMARY_INTENT}}"
- section_synonyms_rotation: ["{{SYN1}}","{{SYN2}}","{{SYN3}}"]

============================================================
GEO SAFETY ENFORCEMENT
============================================================
ALLOWED_PLACE_NAMES: {{ALLOWED_PLACE_NAMES}}
You may ONLY mention places from the above list. Any place not in this list is FORBIDDEN.

When discussing neighborhoods:
- If INPUT_JSON.local_areas exists → use those names for cards and use their notes (do not add new facts).
- If no local_areas → create generic "area-style" cards with names like:
  "Central Neighborhoods", "Quieter Residential Areas", "Urban-Adjacent Communities"
  Each card MUST have internal_link_href and internal_link_text from INPUT_JSON internal links.

============================================================
📊 MARKET SNAPSHOT (MANDATORY TEXT)
============================================================
Include this exact phrasing somewhere in the market snapshot section:

"Data source: {{data_source}}"
"Last updated: {{last_updated_iso}}"

And include these metrics verbatim if present in INPUT_JSON:
- Median price
- Price per square foot  
- Average days on market
- Active listings

You MUST interpret what each metric means for buyer decision-making.
- Do not simply restate numbers
- Explain implications (pace, leverage, comparison use)


============================================================
⚠️ FEATURED LISTINGS DISCLAIMER (MANDATORY)
============================================================
If INPUT_JSON.featured_listings_has_missing_specs is true, you MUST include this exact sentence:
"Some listings may be missing key details such as square footage, lot size, or year built. Confirm specs on the listing page or with your agent."

============================================================
NUMERIC EXACTNESS RULES (strict)
============================================================
- If INPUT_JSON.price_per_sqft_rounded exists, use it as the displayed $/sqft.
- If INPUT_JSON.days_on_market_rounded exists, use it as the displayed Days on Market.
- If INPUT_JSON.market_stats_text exists, do NOT contradict it.
- Do not round, adjust, or "re-interpret" numbers. Copy exactly.

============================================================
🧱 REQUIRED SECTIONS (IN THIS ORDER) - ALL MUST BE HTML
============================================================
Generate HTML inside these sections, NOT Markdown. Each section body MUST contain <h2>, <p>, <ul>, <li> tags.

1️⃣ Hero Overview (<h2>)
Explain:
- What buyers will find on this page
- How to use it effectively
- What types of properties are included
Write 2–3 paragraphs (80-150 words each).

2️⃣ About the {CITY} Real Estate Market
Cover:
- Why people buy here
- Economic / lifestyle context
- Housing diversity
Include local reasoning, not generic statements. 2-4 paragraphs.

3️⃣ Current Market Snapshot
Explain:
- What median price means for this market
- How days on market affects buyer leverage
- Why price per sqft matters for comparisons
Include the required "Data source" and "Last updated" lines.
Include methodology bullets. 3-4 paragraphs.

4️⃣ Common Property Types in {CITY}
Explain:
- Single-family homes characteristics
- Condos / townhomes considerations
- Specialty segments (pool, luxury, etc.)
Include a checklist buyers should consider. 2-3 paragraphs + list.

5️⃣ Neighborhood & Local Pockets
Explain:
- How neighborhoods differ in character
- Density vs space tradeoffs
- Commute vs lifestyle considerations
This section should feel locally informed. 2-4 paragraphs.

6️⃣ Buyer Strategy & How to Prepare
Include:
- Financing preparation
- Touring strategy
- Offer preparation tips
- Inspection & verification advice
The buyer checklist MUST be written as a <ul> containing at least 8 <li> items. Each item should be a clear, actionable step a buyer can take before making an offer.


IMPORTANT CTA GUIDANCE (MANDATORY):
- buyer_strategy.cta.body MUST clearly explain WHEN a buyer should contact an agent, not just why.
- The CTA body should reference concrete moments such as:
  * before touring homes
  * after narrowing a shortlist
  * prior to submitting an offer
  * when reviewing disclosures or HOA documents
- Avoid generic phrases like "get help today" or "expert guidance available".
The CTA body must explain WHEN a buyer should contact an agent
(e.g., before touring, before making an offer, or when comparing similar listings),
not just why an agent is helpful.


2–3 paragraphs + checklist.

7️⃣ Schools, Services & Daily Living
Explain:
- Why schools matter even for non-parents (resale value)
- Services, transit, amenities
- Verification advice for claims
2-3 paragraphs.

8️⃣ Working With an Agent
Explain:
- How agents add value in this market
- Disclosures and documentation
- Negotiation advantages
- Local market insight
Avoid salesy tone — be advisory. 2-3 paragraphs.

9️⃣ Lifestyle & Amenities
Explain:
- Parks, walkability, shopping
- Long-term resale considerations
- Daily quality of life factors
Write visually descriptive prose. 2-3 paragraphs.

🔟 Featured Listings Context
Explain:
- Why featured listings may skew data (size, newness, availability)
- How to interpret them alongside market snapshot
Include the mandatory missing-specs sentence if applicable. 2-3 paragraphs.

============================================================
OUTPUT JSON SCHEMA (exact match required)
============================================================
{
  "seo": {
    "title": "", "meta_description": "", "h1": "", "canonical_path": "",
    "og_title": "", "og_description": ""
  },
  "intro": {
    "subheadline": "", "quick_bullets": ["","","",""], "last_updated_line": ""
  },
  "sections": {
    "hero_overview": { "heading": "", "body": "<h2>...</h2><p>...</p><p>...</p>" },
    "about_area": { "heading": "", "body": "<h2>...</h2><p>...</p><p>...</p>" },
    "market_snapshot": { "heading": "", "body": "<h2>...</h2><p>...</p><p>Data source: ...</p>" },
    "property_types": { "heading": "", "body": "<h2>...</h2><p>...</p><ul><li>...</li></ul>" },
    "neighborhoods": {
      "heading": "", "body": "<h2>...</h2><p>...</p>",
      "cards": [{ "name": "", "blurb": "", "best_for": [], "internal_link_text": "", "internal_link_href": "" }]
    },
    "buyer_strategy": {
      "heading": "", "body": "<h2>...</h2><p>...</p><ul><li>...</li></ul>",
      "cta": { "title": "", "body": "", "button_text": "Contact an agent", "button_href": "/contact" }
    },
    "schools_education": { "heading": "", "body": "<h2>...</h2><p>...</p>" },
    "working_with_agent": { "heading": "", "body": "<h2>...</h2><p>...</p>" },
    "lifestyle_amenities": { "heading": "", "body": "<h2>...</h2><p>...</p>" },
    "featured_listings": { "heading": "", "body": "<h2>...</h2><p>...</p>" }
  },
  "faq": [{ "q": "", "a": "" }],
  "internal_linking": {
    "in_body_links": [{ "href": "", "anchor": "", "context_note": "" }],
    "related_pages": [], "more_in_city": [], "nearby_cities": []
  },
  "trust": {
    "about_brand": "",
    "agent_box": {
      "headline": "Work with a local expert", "body": "",
      "disclaimer": "General info only. Verify details with official sources and the listing broker."
    }
  }
}

============================================================
SECTION CONTENT REQUIREMENTS (anti-thin content)
============================================================
CRITICAL: All section "body" fields MUST contain valid HTML with:
- <h2> for section headings
- <p> for paragraphs (each 80-150 words)
- <ul> and <li> for lists
- 2-4 paragraphs per section minimum

- intro.subheadline MUST incorporate intent_clarifier verbatim when it exists.
- Do not paraphrase or soften it.
- sections.property_types MUST use listing_mix when available:
  * Mention listing_mix.listing_count (if present)
  * Mention 1-2 dominant property types from listing_mix.property_type_counts (if present)
  * Provide practical tradeoffs (HOA docs, reserves, rental caps, parking, insurance) without inventing facts.
- sections.market_snapshot.body:
  * Use the exact numbers from INPUT_JSON
  * Include methodology explanation
  * Include a "snapshot not prediction" caveat
- sections.featured_listings.body MUST explain why featured listings can differ from medians
- sections.buyer_strategy.body MUST include an 8-item checklist buyers can act on

============================================================
SEO RULES
============================================================
- title <= 60 chars
- meta_description <= 155 chars
- H1 must include "{{city}}" and primary intent wording
- Each section: primary intent phrase ONCE + ONE synonym (rotate)
- No keyword stuffing, no filler paragraphs

============================================================
INTERNAL LINKS (exact)
============================================================
- internal_linking.related_pages = INPUT_JSON.internal_links.related_pages
- internal_linking.more_in_city = INPUT_JSON.internal_links.more_in_city
- internal_linking.nearby_cities = INPUT_JSON.internal_links.nearby_cities
- in_body_links must select up to 10 items from those arrays (no new links)

INPUT_JSON:
{{INPUT_JSON}}`;


// ============================================================================
// Repair Prompt Template - Used when semantic validation fails
// ============================================================================
export const REPAIR_PROMPT_TEMPLATE = `The previous output had semantic validation errors that must be fixed.

ERRORS FOUND:
{{ERRORS}}

INSTRUCTIONS:
1. Fix ONLY the failing fields/sections listed above
2. Keep all other content unchanged
3. Output complete JSON with same schema
4. Do not add new keys or change structure
5. Ensure all required phrases are present
6. Only use places from allowed_place_names
7. Ensure all section bodies contain valid HTML with <h2>, <p>, <ul>, <li> tags
8. Each section must have 2-4 paragraphs of 80-150 words each

OUTPUT THE CORRECTED COMPLETE JSON:`;

/**
 * Build repair prompt from validation errors
 */
export function buildRepairPrompt(errors: Array<{ code: string; message: string; path?: string }>): string {
  const errorList = errors
    .map((e, i) => `${i + 1}. [${e.code}] ${e.message}${e.path ? ` (at ${e.path})` : ''}`)
    .join('\n');
  
  return REPAIR_PROMPT_TEMPLATE.replace('{{ERRORS}}', errorList);
}

function sanitizeInputJson(raw: Record<string, unknown>): Record<string, unknown> {
  // Deep clone to avoid mutating original object
  const input = JSON.parse(JSON.stringify(raw));

  // --- HARD DELETE infra / implementation details ---
  delete input.database;
  delete input.db;
  delete input.sql;
  delete input.cloud;
  delete input.infrastructure;
  delete input.pipeline;
  delete input.jobs;
  delete input.scheduler;
  delete input.source_system;
  delete input.storage;
  delete input.connection;
  delete input.internal_debug;

  // --- Normalize data_source (VERY IMPORTANT) ---
  if (input.data_source) {
    input.data_source = 'MLS-synced listing feed';
  }

  // --- Defensive: remove accidental infra strings anywhere ---
  const forbiddenRegex = "moiz";

  const scrub = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace(forbiddenRegex, '').trim();
    }
    if (Array.isArray(value)) {
      return value.map(scrub);
    }
    if (value && typeof value === 'object') {
      for (const k of Object.keys(value)) {
        // @ts-ignore
        value[k] = scrub(value[k]);
      }
      return value;
    }
    return value;
  };

  return scrub(input) as Record<string, unknown>;
}


/**
 * Build v4 user prompt with all placeholders replaced
 */
export function buildUserPromptV4(
  pageTypeConfig: { PAGE_TYPE_SLUG: string; PRIMARY_INTENT: string; SYN1: string; SYN2: string; SYN3: string },
  inputJson: Record<string, unknown>
): string {
  let prompt = USER_PROMPT_TEMPLATE_V4;

  // Replace page type placeholders
  prompt = prompt.replace(/\{\{PAGE_TYPE_SLUG\}\}/g, pageTypeConfig.PAGE_TYPE_SLUG);
  prompt = prompt.replace(/\{\{PRIMARY_INTENT\}\}/g, pageTypeConfig.PRIMARY_INTENT);
  prompt = prompt.replace(/\{\{SYN1\}\}/g, pageTypeConfig.SYN1);
  prompt = prompt.replace(/\{\{SYN2\}\}/g, pageTypeConfig.SYN2);
  prompt = prompt.replace(/\{\{SYN3\}\}/g, pageTypeConfig.SYN3);

  // Replace input JSON placeholders
  const dataSource = (inputJson.data_source as string) || 'MLS-synced listing feed';
  const lastUpdated = (inputJson.last_updated_iso as string) || new Date().toISOString();
  const city = (inputJson.city as string) || '';
  const allowedPlaceNames = (inputJson.allowed_place_names as string[]) || [];

  prompt = prompt.replace(/\{\{data_source\}\}/g, dataSource);
  prompt = prompt.replace(/\{\{last_updated_iso\}\}/g, lastUpdated);
  prompt = prompt.replace(/\{\{city\}\}/g, city);
  prompt = prompt.replace(/\{\{ALLOWED_PLACE_NAMES\}\}/g, JSON.stringify(allowedPlaceNames));
  
  const sanitizedInput = sanitizeInputJson(inputJson);

  prompt = prompt.replace(
    /\{\{INPUT_JSON\}\}/g,
    JSON.stringify(sanitizedInput)
  );

  
  // prompt = prompt.replace(/\{\{INPUT_JSON\}\}/g, JSON.stringify(inputJson));

  return prompt;
}
