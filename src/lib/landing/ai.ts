import { getPgPool } from "@/lib/db";
import type { LandingKind } from "@/types/landing";
import { getSupabase } from "@/lib/supabase";
import OpenAI from "openai";
import { isBuildPhase } from "@/lib/env/buildDetection";

/**
 * Type representing the structure of landing page content JSON
 * stored in the landing_pages.content column
 * 
 * The actual schema from the database includes:
 * - seo: { h1, title, og_title, canonical_path, og_description, meta_description }
 * - intro: { subheadline, quick_bullets, last_updated_line }
 * - trust: { agent_box, about_brand }
 * - sections: { about_area, hero_overview, neighborhoods, buyer_strategy, property_types, market_snapshot, featured_listings, schools_education, working_with_agent, lifestyle_amenities }
 * - internal_linking: { more_in_city, in_body_links, nearby_cities, related_pages }
 */
type LandingContentSection = { heading?: string; body?: string; cards?: any[]; cta?: any }
type LandingContent = {
  seo?: {
    h1?: string
    title?: string
    og_title?: string
    canonical_path?: string
    og_description?: string
    meta_description?: string
  }
  intro?: {
    subheadline?: string
    quick_bullets?: string[]
    last_updated_line?: string
  }
  trust?: {
    agent_box?: { headline?: string; body?: string; disclaimer?: string }
    about_brand?: string
  }
  sections?: {
    // New schema keys from database
    about_area?: LandingContentSection
    hero_overview?: LandingContentSection
    neighborhoods?: LandingContentSection
    buyer_strategy?: LandingContentSection
    property_types?: LandingContentSection
    market_snapshot?: LandingContentSection
    featured_listings?: LandingContentSection
    schools_education?: LandingContentSection
    working_with_agent?: LandingContentSection
    lifestyle_amenities?: LandingContentSection
    // Legacy keys (keeping for backward compatibility)
    local_areas?: LandingContentSection
  }
  internal_linking?: {
    more_in_city?: Array<{ href?: string; anchor?: string }>
    in_body_links?: Array<{ href?: string; anchor?: string; context_note?: string }>
    nearby_cities?: Array<{ href?: string; anchor?: string }>
    related_pages?: Array<{ href?: string; anchor?: string }>
  }
}

/**
 * Converts the new structured content JSON into legacy HTML format
 * for the LandingData.aiDescriptionHtml field used by LandingTemplate
 */
export function contentToAiDescriptionHtml(content: LandingContent | null | undefined): string {
  if (!content) return ''
  const parts: string[] = []

  // Helper to add a section with heading and body
  const addSection = (section?: LandingContentSection) => {
    if (!section) return
    if (section.heading) parts.push(`<h2>${section.heading}</h2>`)
    if (section.body) {
      // Convert newlines to proper HTML paragraphs
      const paragraphs = section.body.split('\n\n').filter(p => p.trim())
      paragraphs.forEach(p => {
        // Check if it's a bullet list
        if (p.trim().startsWith('- ')) {
          const items = p.split('\n').filter(line => line.trim().startsWith('- '))
          parts.push('<ul>' + items.map(item => `<li>${item.replace(/^-\s*/, '')}</li>`).join('') + '</ul>')
        } else {
          parts.push(`<p>${p.trim()}</p>`)
        }
      })
    }
    // Handle neighborhood cards
    if (section.cards && section.cards.length > 0) {
      parts.push('<div class="neighborhood-cards">')
      section.cards.forEach(card => {
        parts.push(`<div class="neighborhood-card">`)
        if (card.name) parts.push(`<h3>${card.name}</h3>`)
        if (card.blurb) parts.push(`<p>${card.blurb}</p>`)
        if (card.best_for && card.best_for.length) {
          parts.push(`<p><strong>Best for:</strong> ${card.best_for.join(', ')}</p>`)
        }
        if (card.internal_link_href && card.internal_link_text) {
          parts.push(`<p><a href="${card.internal_link_href}">${card.internal_link_text}</a></p>`)
        }
        parts.push(`</div>`)
      })
      parts.push('</div>')
    }
    // Handle CTA
    if (section.cta) {
      parts.push(`<div class="cta-box">`)
      if (section.cta.title) parts.push(`<h3>${section.cta.title}</h3>`)
      if (section.cta.body) parts.push(`<p>${section.cta.body}</p>`)
      if (section.cta.button_href && section.cta.button_text) {
        parts.push(`<p><a href="${section.cta.button_href}" class="cta-button">${section.cta.button_text}</a></p>`)
      }
      parts.push(`</div>`)
    }
  }

  // Add intro section if present
  if (content.intro) {
    if (content.intro.subheadline) {
      parts.push(`<p class="subheadline"><em>${content.intro.subheadline}</em></p>`)
    }
    if (content.intro.quick_bullets && content.intro.quick_bullets.length > 0) {
      parts.push('<ul class="quick-bullets">' + 
        content.intro.quick_bullets.map(b => `<li>${b}</li>`).join('') + 
      '</ul>')
    }
  }

  // Process sections in a logical order
  if (content.sections) {
    const s = content.sections
    // Hero/Overview first
    addSection(s.hero_overview)
    // About the area
    addSection(s.about_area)
    // Market snapshot
    addSection(s.market_snapshot)
    // Featured listings
    addSection(s.featured_listings)
    // Property types
    addSection(s.property_types)
    // Neighborhoods
    addSection(s.neighborhoods)
    // Schools
    addSection(s.schools_education)
    // Lifestyle
    addSection(s.lifestyle_amenities)
    // Buyer strategy
    addSection(s.buyer_strategy)
    // Working with agent
    addSection(s.working_with_agent)
    // Legacy: local_areas (backward compatibility)
    addSection(s.local_areas)
  }

  // Add trust section (about brand and agent box)
  if (content.trust) {
    if (content.trust.about_brand) {
      parts.push(`<div class="trust-section">`)
      parts.push(`<p>${content.trust.about_brand}</p>`)
      parts.push(`</div>`)
    }
    if (content.trust.agent_box) {
      parts.push(`<div class="agent-box">`)
      if (content.trust.agent_box.headline) parts.push(`<h3>${content.trust.agent_box.headline}</h3>`)
      if (content.trust.agent_box.body) parts.push(`<p>${content.trust.agent_box.body}</p>`)
      if (content.trust.agent_box.disclaimer) parts.push(`<p class="disclaimer"><small>${content.trust.agent_box.disclaimer}</small></p>`)
      parts.push(`</div>`)
    }
  }

  // Add internal links section
  if (content.internal_linking) {
    const links = content.internal_linking
    const allLinks = [
      ...(links.related_pages || []),
      ...(links.more_in_city || [])
    ].filter(l => l.href && l.anchor)
    
    if (allLinks.length > 0) {
      parts.push(`<div class="related-links">`)
      parts.push(`<h3>Related Pages</h3>`)
      parts.push('<ul>' + allLinks.map(l => `<li><a href="${l.href}">${l.anchor}</a></li>`).join('') + '</ul>')
      parts.push(`</div>`)
    }
  }

  return parts.join('\n\n')
}

/**
 * SEO CONTENT GENERATOR SYSTEM PROMPT
 * This is the complete client-provided prompt for generating city landing pages
 */
export const SEO_CONTENT_GENERATOR_PROMPT = `
SYSTEM:
You are a senior Real Estate SEO strategist + local copywriter specializing in California city landing pages.
You write for humans first, but structure content to rank for high-intent searches.

NON-NEGOTIABLE RULES:
1) Truth & Compliance
- Do NOT invent facts, rankings, numbers, neighborhood characteristics, school quality, safety, taxes, HOA fees, climate, commute times, "best" claims, or legal/financial advice.
- You MAY only echo factual items explicitly present in INPUT (including neighborhood notes).
- If something is unknown, speak in general terms without naming specifics and without implying certainty (e.g., "buyers often compare…").
- No promises/guarantees. Avoid "best investment", "will increase value", "always", "never".
- Fair Housing: do not use exclusionary/discriminatory language; avoid demographic targeting.

2) Originality (anti-boilerplate)
- Write as if this page is the only one on the internet for this exact filter + city.
- Avoid template-y phrasing. Do not reuse the same sentence openings repeatedly.
- Add city-specific "color" ONLY when it is supported by input notes; otherwise keep it general.

3) SEO Fit
- Target primary intent: [CITY] + [FILTER_LABEL] + synonyms (e.g., "$1M+", "over $1,000,000", "million-dollar homes", "luxury homes")—use naturally, not stuffed.
- Keep headings descriptive and keyword-aligned.
- Provide scannable structure: short paragraphs, bullets, and micro-subheads inside section bodies where useful.

4) Output Requirements
- Output must be VALID JSON ONLY.
- No Markdown, no comments, no trailing commas, no additional keys beyond the required schema unless explicitly allowed.
- All URLs must be relative paths (start with "/").
- Ensure character limits: title <= 60, meta_description <= 155.
- Ensure total main copy across sections ~1,300–1,900 words.
- FAQ must contain 8–12 items with real answers in plain text.

TASK:
Generate a city-specific landing page from the provided INPUT JSON and match the REQUIRED OUTPUT JSON STRUCTURE exactly.

INPUT:
{...as provided...}

REQUIRED OUTPUT JSON STRUCTURE:
{
  "seo": {
    "title": "",
    "meta_description": "",
    "h1": "",
    "canonical_path": "",
    "og_title": "",
    "og_description": ""
  },
  "page_intro": {
    "subheadline": "",
    "quick_bullets": ["", "", "", ""],
    "last_updated_line": ""
  },
  "toc": [
    { "id": "market-snapshot", "label": "Market Snapshot" },
    { "id": "featured-listings", "label": "Featured Listings" },
    { "id": "what-1m-buys", "label": "What $1M+ Buys in CITY" },
    { "id": "neighborhoods", "label": "Neighborhoods to Know" },
    { "id": "property-types", "label": "Property Types & Architecture" },
    { "id": "buyer-strategy", "label": "Buyer Strategy for $1M+ Homes" },
    { "id": "faq", "label": "FAQ" }
  ],
  "sections": [
    {
      "id": "market-snapshot",
      "heading": "",
      "body": "",
      "stats": [
        { "label": "Median Price", "value": "" },
        { "label": "$/Sqft", "value": "" },
        { "label": "Days on Market", "value": "" },
        { "label": "Active Listings", "value": "" }
      ]
    },
    {
      "id": "featured-listings",
      "heading": "",
      "body": ""
    },
    {
      "id": "what-1m-buys",
      "heading": "",
      "body": ""
    },
    {
      "id": "neighborhoods",
      "heading": "",
      "body": "",
      "neighborhood_cards": [
        { "name": "", "blurb": "", "best_for": ["", ""], "internal_link_text": "", "internal_link_href": "" }
      ]
    },
    {
      "id": "property-types",
      "heading": "",
      "body": ""
    },
    {
      "id": "buyer-strategy",
      "heading": "",
      "body": "",
      "cta": { "title": "", "body": "", "button_text": "Contact an agent", "button_href": "/contact" }
    }
  ],
  "faq": [
    { "q": "", "a": "" }
  ],
  "internal_linking": {
    "in_body_links": [
      { "href": "", "anchor": "", "context_note": "" }
    ],
    "related_pages": [],
    "more_in_city": [],
    "nearby_cities": []
  },
  "trust": {
    "about_brand": "",
    "agent_box": {
      "headline": "Work with a local expert",
      "body": "",
      "disclaimer": "General info only. Verify details with official sources and the listing broker."
    }
  },
  "schema_jsonld": {
    "BreadcrumbList": {},
    "FAQPage": {},
    "ItemList": {}
  }
}

CONTENT CONSTRAINTS (do not violate):
- market-snapshot body: 150–220 words AND must mention data_source + last_updated_iso in the text.
- featured-listings body: 80–140 words; if any of beds/baths/sqft are null, include a single sentence: "Details vary—open the listing for full specs."
- what-1m-buys body: 180–260 words; explain tradeoffs (location vs size vs condition vs HOA) without adding facts.
- neighborhoods intro body: 80–120 words; neighborhood_cards: one card per INPUT neighborhood; each blurb 70–110 words using only INPUT notes. If notes are sparse, keep it general.
- property-types body: 160–240 words; do not assert specific architectural styles unless provided.
- buyer-strategy body: 200–320 words; include a checklist of 8–12 bullet points inside the text (use "- " hyphen bullets).
- faq: 8–12 items; each answer 60–110 words; no invented facts.

INTERNAL LINKING RULES:
- Populate internal_linking.related_pages, more_in_city, nearby_cities directly from INPUT.internal_links arrays (same order).
- Create 6–10 in_body_links using the same href/anchor pairs from those arrays.
- Each in_body_link must include a short context_note describing placement (e.g., "Place after Market Snapshot paragraph 2.").
- All link anchors must match INPUT anchors exactly.

SEO TEXT RULES:
- Use "$1M+" plus exactly ONE synonym per section body (rotate between: "over $1,000,000", "million-dollar homes", "luxury homes").
- The H1 must include CITY + "$1M+" wording (not "1m").
- Canonical path must be: /[state]/[city]/[slug] using INPUT values and keep existing casing style from INPUT (e.g., /california/san-diego/homes-over-1m).

SCHEMA RULES:
- BreadcrumbList: include positions and item URLs for Home, State, City, and this Page (use canonical_path).
- FAQPage: include all FAQ Q/A pairs.
- ItemList: include featured_listings as ListItem elements if present (id, url, price, status). If fields are null, omit those properties.

FINAL CHECK BEFORE RETURNING JSON:
- No hallucinated facts.
- Valid JSON.
- Word counts within ranges.
- Title/meta length respected.
Return JSON only.
`.trim();

// Memory cache (runtime only)
const memCache = new Map<string, string>();
// Track in-flight generations to avoid duplicate work (metadata + page render)
const pending = new Map<string, Promise<string | undefined>>();
let attemptedInit = false;

async function ensureLegacyTable(pool: any) {
  if (attemptedInit) return;
  attemptedInit = true;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS landing_ai_descriptions (
      city text NOT NULL,
      kind text NOT NULL,
      html text NOT NULL,
      generated_at timestamptz DEFAULT now(),
      PRIMARY KEY (city, kind)
    )`);
  } catch {
    // best-effort only
  }
}

export interface GenerateAIDescriptionOptions {
  forceRegenerate?: boolean;
  customPrompt?: string;
  promptKey?: string;
}

function isPlaceholderHtml(html?: string | null): boolean {
  if (!html) return false;
  // Detect our known placeholder marker or obvious placeholder phrasing
  const s = String(html);
  return (
    s.includes("<!--placeholder-->") ||
    /is generating\.? please refresh/i.test(s)
  );
}

// NEW deterministic fallback: exactly 10 sections, each with <h2> and 3 <p>.
function buildFallbackDescription(city: string, kind: string): string {
  const cityTitle = city.replace(/\b\w/g, (c) => c.toUpperCase());
  const niceKind = kind.replace(/-/g, " ");

  const baseHeadings = [
    `Living in ${cityTitle} as a ${niceKind} buyer`,
    `${cityTitle} neighborhoods overview for ${niceKind}`,
    `Lifestyle and amenities across ${cityTitle}`,
    `Local market trends in ${cityTitle}`,
    `Homes and architecture styles in ${cityTitle}`,
    `Outdoor life and recreation in ${cityTitle}`,
    `Schools and community in ${cityTitle}`,
    `Getting around ${cityTitle}: commute and connectivity`,
    `Working with local experts in ${cityTitle}`,
    `Planning your next move in ${cityTitle}`,
  ];

  const uniqueHeadings = Array.from(new Set(baseHeadings)).slice(0, 10);
  const neighborhoods = [
    "La Jolla",
    "Pacific Beach",
    "North Park",
    "Mission Hills",
  ];

  const sections: string[] = [];
  uniqueHeadings.forEach((heading, idx) => {
    const nh = neighborhoods[idx % neighborhoods.length];
    const intro = fakerSentence(
      `${heading} – discover how ${niceKind} opportunities in ${cityTitle} connect with daily life in ${nh}.`
    );
    const mid = fakerSentence(
      `In ${nh}, residents experience a distinct blend of architecture, street life, and access to the broader ${cityTitle} region that appeals to ${niceKind} buyers looking for long‑term value.`
    );
    const close = fakerSentence(
      `As you explore listings in and around ${nh}, compare how each block, building, and view line up with your budget, timing, and long‑term plans in ${cityTitle}.`
    );

    sections.push(
      `<h2>${escapeHtml(heading)}</h2>` +
        `\n<p>${escapeHtml(intro)}</p>` +
        `\n<p>${escapeHtml(mid)}</p>` +
        `\n<p>${escapeHtml(close)}</p>`
    );
  });

  return sections.join("\n\n");
}

// Lightweight lorem-style extender to avoid external faker dependency
function fakerSentence(seed: string): string {
  const extra = [
    " The streets mix everyday convenience with small moments of discovery that keep long‑time locals engaged.",
    " Sidewalk cafés, neighborhood parks, and independent shops create a rhythm that feels lived‑in rather than staged.",
    " Blocks shift gradually from quieter residential pockets to livelier commercial corridors, giving buyers options at different price points.",
    " Subtle changes in elevation, tree cover, and architecture tell a story about how the area has grown over time.",
    " Weekends often reveal how people actually use the city, from early‑morning coffee runs to late‑afternoon meetups in local gathering spots.",
  ];
  const idx = Math.abs(hashCode(seed)) % extra.length;
  return seed + extra[idx];
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// Deterministic long-form fallback that aims for ~1000+ words split into paragraphs.
// Helper: generate a reasonably sized paragraph for a given topic.
function generateParagraphForTopicImpl(
  cityTitle: string,
  niceKind: string,
  topic: string
) {
  // Generate unique content for each topic without repetition
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("neighborhood")) {
    return `${cityTitle} features diverse neighborhoods, each with its own character and appeal. When searching for ${niceKind}, location plays a crucial role in determining property value and lifestyle fit. Popular areas often combine convenient amenities with strong community connections. Buyers should explore different districts to understand variations in architecture, density, and local culture. Working with knowledgeable local agents helps identify neighborhoods that align with specific priorities and budget considerations.`;
  }

  if (
    topicLower.includes("housing stock") ||
    topicLower.includes("buyers look for")
  ) {
    return `The ${niceKind} market in ${cityTitle} encompasses various architectural styles and property configurations. Buyers typically prioritize factors such as layout efficiency, natural lighting, modern updates, and outdoor space. Some seek move-in ready homes with recent renovations, while others prefer properties with potential for customization. Understanding the typical inventory helps buyers set realistic expectations and identify opportunities that match their specific requirements.`;
  }

  if (
    topicLower.includes("amenities") ||
    topicLower.includes("schools") ||
    topicLower.includes("lifestyle")
  ) {
    return `${cityTitle} provides access to a range of amenities that enhance daily life. Local schools, parks, shopping districts, and dining options vary by neighborhood and influence buyer decisions. Proximity to recreational facilities, cultural attractions, and community services often factors into long-term satisfaction. Families may prioritize school ratings and youth programs, while others focus on walkability and entertainment options. Evaluating these lifestyle elements during the search process helps ensure the chosen property supports your daily routines and future plans.`;
  }

  if (
    topicLower.includes("market trends") ||
    topicLower.includes("pricing") ||
    topicLower.includes("competition")
  ) {
    return `The real estate market in ${cityTitle} experiences fluctuations based on inventory levels, buyer demand, and broader economic factors. Understanding current pricing trends helps buyers make informed offers and negotiate effectively. Seasonal patterns may affect competition and availability. Monitoring recent sales data and time-on-market statistics provides valuable context for evaluating individual listings. Professional guidance helps navigate market dynamics and identify optimal timing for purchases.`;
  }

  if (topicLower.includes("home search") || topicLower.includes("touring")) {
    return `Conducting an effective search for ${niceKind} in ${cityTitle} requires a systematic approach. Begin by defining your must-have features and deal-breakers. Schedule property tours strategically to compare options directly. During visits, assess structural condition, layout functionality, and how spaces meet your specific needs. Take notes and photos to aid comparison. Pay attention to neighborhood feel during different times of day. A thorough evaluation process reduces the risk of buyer's remorse and helps identify the best fit.`;
  }

  if (topicLower.includes("financing") || topicLower.includes("working with")) {
    return `Securing financing for ${niceKind} in ${cityTitle} involves several steps. Getting pre-approved establishes your budget and strengthens your position as a buyer. Local lenders familiar with the area can provide insights on property values and loan options. Professional real estate agents bring market expertise, negotiation skills, and access to both listed and off-market properties. Building a team of trusted advisors—including lenders, agents, and inspectors—streamlines the purchase process and helps avoid common pitfalls.`;
  }

  // Default/closing
  return `For buyers considering ${niceKind} in ${cityTitle}, thorough preparation and local expertise make a significant difference. Working with experienced professionals provides access to market knowledge, negotiation support, and guidance throughout the transaction. Whether you're relocating to the area or seeking an investment property, taking time to understand the local market landscape helps ensure successful outcomes. Contact qualified local agents to discuss your specific goals and begin your property search with confidence.`;
}

// Legacy long-form fallback (kept for compatibility where used by executor).
function buildLongFallbackDescription(
  city: string,
  kind: string,
  maxWords = 1000
): string {
  const cityTitle = city.replace(/\b\w/g, (c) => c.toUpperCase());
  const niceKind = kind.replace(/-/g, " ");
  const sections = [
    `<h2>Discover ${escapeHtml(cityTitle)} ${escapeHtml(niceKind)}</h2>`,
    `<p>Welcome to your comprehensive guide to ${escapeHtml(
      niceKind
    )} in ${escapeHtml(
      cityTitle
    )}. This page highlights the lifestyle, neighborhoods, and housing options that make this market distinct. Whether you're relocating, upgrading, or investing, understanding the local landscape helps you make informed decisions.</p>`,
  ];

  // Topics to cover with unique content for each
  const topics = [
    "Neighborhood character and popular areas to consider",
    "Typical housing stock and what different buyers look for",
    "Local amenities, schools, and lifestyle attractions",
    "Market trends and buyer considerations (pricing, competition, seasonality)",
    "What to expect during your home search and tips for touring",
    "Financing considerations and working with local agents",
    "Closing thoughts and a gentle call to action to contact the team",
  ];

  const paras: string[] = [...sections];
  let accumulatedWords = paras
    .join(" ")
    .replace(/<[^>]+>/g, "")
    .split(/\\s+/)
    .filter(Boolean).length;

  for (let i = 0; i < topics.length; i++) {
    if (accumulatedWords >= maxWords) break;

    const topic = topics[i];
    const body = generateParagraphForTopicImpl(cityTitle, niceKind, topic);

    // Add section heading for better structure (except first which already has intro heading)
    const headingText = topic.split(" and ")[0]; // Take first part of topic as heading
    const heading =
      i > 0 && i < topics.length - 1
        ? `<h3>${escapeHtml(headingText)}</h3>`
        : "";

    const paraHtml = `${heading}\n<p>${escapeHtml(body)}</p>`;
    paras.push(paraHtml);

    accumulatedWords += body.split(/\\s+/).filter(Boolean).length;
  }

  console.log("[ai.desc] 📝 Generated fallback content", {
    city: cityTitle,
    kind: niceKind,
    sections: paras.length,
    words: accumulatedWords,
  });

  return paras.join("\\n\\n");
}

// Ensure text is wrapped in <p> paragraphs. If already contains <p> tags, return as-is.
function ensureParagraphHtml(raw: string) {
  if (/<p[\s>]/i.test(raw)) return raw;
  const parts = String(raw)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
}

// New helper: truncate HTML by paragraph while preserving tags and closing paragraphs.
// function truncateHtmlByParagraphs(html: string, maxWords: number): string {
//   if (!html) return html
//   // Extract paragraph blocks if present
//   const paraRegex = /<p[^>]*>[\s\S]*?<\/p>/gi
//   const paras = html.match(paraRegex)
//   if (paras && paras.length) {
//     const out: string[] = []
//     let words = 0
//     for (const p of paras) {
//       // remove tags to count words
//       const inner = p.replace(/<[^>]+>/g, ' ')
//       const wcount = inner.split(/\s+/).filter(Boolean).length
//       if (words + wcount <= maxWords) {
//         out.push(p)
//         words += wcount
//       } else {
//         // need partial paragraph
//         const remaining = Math.max(0, maxWords - words)
//         if (remaining > 0) {
//           // extract plain text, take remaining words, re-wrap
//           const text = inner.replace(/\s+/g, ' ').trim().split(/\s+/).slice(0, remaining).join(' ')
//           out.push(`<p>${escapeHtml(text)}</p>`)
//           words += remaining
//         }
//         break
//       }
//     }
//     return out.join('\n')
//   } else {
//     // No paragraphs: fallback to plain-text truncate and wrap in one <p>
//     const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
//     const truncated = plain.split(/\s+/).slice(0, maxWords).join(' ')
//     return `<p>${escapeHtml(truncated)}</p>`
//   }
// }

function truncateHtmlByParagraphs(html: string, maxWords: number): string {
  if (!html) return html;

  // If the HTML already has structured <h2>/<h3> headings, do NOT mutilate it.
  // We prefer slightly longer content over breaking the structure that the
  // section parser relies on.
  if (/<h[23][\s>]/i.test(html)) {
    return html;
  }

  // Existing logic for plain-text / heading-free HTML
  const paraRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
  const paras = html.match(paraRegex);

  if (paras && paras.length) {
    const out: string[] = [];
    let words = 0;

    for (const p of paras) {
      const inner = p.replace(/<[^>]+>/g, " ");
      const wcount = inner.split(/\s+/).filter(Boolean).length;

      if (words + wcount <= maxWords) {
        out.push(p);
        words += wcount;
      } else {
        const remaining = Math.max(0, maxWords - words);
        if (remaining > 0) {
          const text = inner
            .replace(/\s+/g, " ")
            .trim()
            .split(/\s+/)
            .slice(0, remaining)
            .join(" ");

          out.push(`<p>${escapeHtml(text)}</p>`);
          words += remaining;
        }
        break;
      }
    }

    return out.join("\n");
  } else {
    const plain = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const truncated = plain.split(/\s+/).slice(0, maxWords).join(" ");
    return `<p>${escapeHtml(truncated)}</p>`;
  }
}

// Modify callOpenAI to use gpt-5-mini with fixed temperature=1
async function callOpenAI(
  prompt: string,
  maxTokens?: number
): Promise<string | undefined> {
  const modelName = "gpt-5-mini";
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.OPENAI_TIMEOUT_MS || 25000)
  );
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const maxTokensConfigured = Number(process.env.OPENAI_MAX_TOKENS || 3000);
    const maxTokensToUse =
      typeof maxTokens === "number"
        ? Math.min(maxTokensConfigured, Math.max(64, Math.floor(maxTokens)))
        : maxTokensConfigured;

    const started = Date.now();
    console.log("[ai.desc] 🔄 Calling OpenAI API", {
      model: modelName,
      maxTokens: maxTokensToUse,
      promptLength: prompt.length,
      promptPreview: prompt.slice(0, 150) + "...",
    });

    const completion = await client.chat.completions.create(
      {
        model: modelName,
        temperature: 1,
        max_completion_tokens: maxTokensToUse,
        messages: [
          {
            role: "system",
            content:
              "You are an expert real estate copywriter creating engaging, informative landing page content. Always return valid HTML and follow the user instructions exactly.",
          },
          { role: "user", content: prompt },
        ],
      },
      { signal: controller.signal as any }
    );

    const ms = Date.now() - started;
    const content = completion.choices?.[0]?.message?.content?.trim();
    const finishReason = completion.choices?.[0]?.finish_reason;
    const tokensUsed = completion.usage?.total_tokens || 0;

    console.log("[ai.desc] ✅ OpenAI response received", {
      model: modelName,
      ms,
      hasContent: !!content,
      contentLength: content?.length || 0,
      finishReason,
      tokensUsed,
      contentPreview: (content || "").slice(0, 200),
    });

    return content || undefined;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      console.error("[ai.desc] ⏱️ OpenAI request timeout", {
        timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 25000),
      });
    } else {
      console.error("[ai.desc] ❌ OpenAI error", {
        message: e?.message || String(e),
        status: e?.status,
        type: e?.type,
        code: e?.code,
        param: e?.param,
        error: e?.error,
      });
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(str: string) {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ] as string)
  );
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildPrompt(
  city: string,
  kind: LandingKind,
  customPrompt?: string
): string {
  const cityTitle = toTitleCase(city);
  const niceKind = kind.replace(/-/g, " ");

  if (customPrompt) return customPrompt;

  return [
    `You are an expert real estate SEO writer.`,
    `Generate a fully-structured HTML landing page description for ${cityTitle}, focusing on "${niceKind}".`,

    `HARD REQUIREMENTS:`,
    `- Output ONLY valid HTML (no markdown, no commentary).`,
    `- Length: 1500–2400 words.`,
    `- EXACTLY 10 SECTIONS.`,
    `- EVERY section MUST start with a <h2>SECTION TITLE</h2>.`,
    `- After each <h2>, write 2–4 <p> paragraphs.`,
    `- No <h1> allowed.`,
    `- No duplicated paragraphs.`,
    `- No repeated wording.`,
    `- Every section must be unique and non-repetitive.`,
    `- Make content specific to ${cityTitle} and ${niceKind}.`,
    `- MUST mention and naturally integrate these neighborhoods: La Jolla, Pacific Beach, North Park, Mission Hills.`,

    `THE 10 SECTIONS YOU MUST OUTPUT (IN ORDER):`,
    `1. <h2>Introduction to ${cityTitle} ${niceKind}</h2>`,
    `2. <h2>Lifestyle & Community Overview</h2>`,
    `3. <h2>Major Neighborhoods</h2>`,
    `4. <h2>Market Trends & Pricing</h2>`,
    `5. <h2>Property Types & Architecture</h2>`,
    `6. <h2>Amenities & Daily Living</h2>`,
    `7. <h2>Schools & Family Appeal</h2>`,
    `8. <h2>Outdoor Living & Recreation</h2>`,
    `9. <h2>Buyer Strategies</h2>`,
    `10. <h2>Final Thoughts</h2>`,

    `FORMAT EXAMPLE (IMPORTANT):`,
    `<h2>Section Title</h2>`,
    `<p>Paragraph one.</p>`,
    `<p>Paragraph two.</p>`,
    `<p>Paragraph three.</p>`,

    `Follow this exact structure for all 10 sections.`,
    `Return ONLY raw HTML.`,
  ].join("\n");
}

export async function generateAIDescription(
  city: string,
  kind: LandingKind,
  opts: GenerateAIDescriptionOptions = {}
): Promise<string | undefined> {
  // ⚠️ DEPRECATION WARNING: This function is deprecated.
  // Use generateLandingPageContent() from @/ai/landing.ts instead.
  // The new generator uses:
  // - Hybrid model fallback (gpt-5-mini → gpt-4o-mini)
  // - Real Cloud SQL data via buildInputJson()
  // - Strict JSON schema validation
  // - Client-provided prompts (BASE_PROMPT + USER_PROMPT_TEMPLATE)
  console.warn(
    "[ai.desc] DEPRECATED: Legacy HTML generator called. " +
    "Consider using generateLandingPageContent() from @/ai/landing.ts instead. " +
    `City: ${city}, Kind: ${kind}`
  );

  const loweredCity = city.toLowerCase();
  const key = `${loweredCity}::${kind}`;
  const debug = !!process.env.LANDING_DEBUG;
  const trace = !!process.env.LANDING_TRACE;

  if (trace)
    console.log("[ai.desc] START", {
      city: loweredCity,
      kind,
      force: opts.forceRegenerate,
      envOpenAI: !!process.env.OPENAI_API_KEY,
      hasCustomPrompt: !!opts.customPrompt,
      promptKey: opts.promptKey,
    });

  if (pending.has(key)) {
    if (trace) console.log("[ai.desc] pending awaited", key);
    return pending.get(key)!;
  }

  // Skip OpenAI generation during build phase
  if (isBuildPhase()) {
    if (trace || debug)
      console.warn("[ai.desc] skipping OpenAI generation due to build phase", {
        key,
        hasKey: !!process.env.OPENAI_API_KEY,
      });
    return undefined;
  }
  
  // ============================================================================
  // HARD GUARD: Check if AI generation is allowed
  // ============================================================================
  // AI generation should only be triggered from admin routes that call
  // enableAIGeneration() first, or from CLI with ALLOW_AI_GENERATION=true
  // ============================================================================
  const { shouldBlockAIGeneration } = await import('@/lib/utils/build-guard');
  if (shouldBlockAIGeneration()) {
    console.warn("[ai.desc] AI generation blocked - not running in admin context", {
      key,
      hint: "Call enableAIGeneration() from admin route or set ALLOW_AI_GENERATION=true"
    });
    // Return undefined to indicate no AI content (falls back to cached or empty)
    return undefined;
  }

  // 1. Supabase lookup (preferred) - check content column and convert JSON to HTML
  try {
    const sb = getSupabase();
    if (sb) {
      // Use order + limit instead of maybeSingle to handle multiple rows safely
      const { data: rows, error } = await sb
        .from("landing_pages")
        .select("content")
        .ilike("city", loweredCity)
        .eq("page_name", kind)
        .order("updated_at", { ascending: false })
        .limit(1);
      const data = rows?.[0];
      if (error) {
        if (trace)
          console.warn("[ai.desc] supabase select error", {
            key,
            message: error.message,
            code: error.code,
          });
      } else if (
        data?.content &&
        !opts.forceRegenerate &&
        !process.env.FORCE_AI_REGEN
      ) {
        // Parse content JSON and convert to HTML string for legacy template
        const rawContent = data.content;
        const content: LandingContent =
          typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        
        // Convert structured JSON to HTML string using helper
        const contentValue = contentToAiDescriptionHtml(content);
        
        if (!contentValue) {
          if (trace) console.log("[ai.desc] supabase miss (empty content after conversion)", { key });
        } else {
          // If a custom prompt is provided, ensure cached HTML is sufficiently long to satisfy the prompt expectations.
          const minLen = Number(process.env.LANDING_MIN_DESC_LENGTH || 3000);
          const cachedLen = String(contentValue || "").length;
          if (isPlaceholderHtml(contentValue)) {
            console.warn(
              "[ai.desc] supabase value is placeholder; ignoring and regenerating",
              { key }
            );
          } else if (opts.customPrompt && cachedLen < minLen) {
            console.warn(
              "[ai.desc] supabase cached html too short for custom prompt; forcing regeneration",
              { key, cachedLen, minLen }
            );
          } else {
            memCache.set(key, contentValue);
            if (trace) console.log("[ai.desc] supabase cache hit (JSON->HTML)", key);
            return contentValue;
          }
        }
      } else if (trace) {
        console.log("[ai.desc] supabase miss", {
          key,
          hadData: !!data?.content,
        });
      }
    } else if (trace) {
      console.log("[ai.desc] no supabase client (missing env)");
    }
  } catch (e: any) {
    console.warn("[ai.desc] supabase lookup failed", e.message);
  }

  // 2. Legacy PG lookup
  if (!opts.forceRegenerate && !process.env.FORCE_AI_REGEN) {
    try {
      const pool = await getPgPool();
      await ensureLegacyTable(pool);
      const { rows } = await pool.query(
        "SELECT html FROM landing_ai_descriptions WHERE city=$1 AND kind=$2",
        [loweredCity, kind]
      );
      if (rows[0]?.html) {
        const legacyHtml = rows[0].html as string;
        if (isPlaceholderHtml(legacyHtml)) {
          console.warn(
            "[ai.desc] legacy pg value is placeholder; will attempt regeneration",
            { key }
          );
        } else {
          memCache.set(key, legacyHtml);
          if (trace) console.log("[ai.desc] legacy pg hit", key);
          // Best effort: sync to Supabase if possible (skip if placeholder)
          try {
            const sb2 = getSupabase();
            if (sb2) {
              if (trace)
                console.log("[ai.desc] syncing legacy -> supabase", { key });
              await sb2.from("landing_pages").upsert(
                {
                  city: loweredCity,
                  page_name: kind,
                  kind,
                  content: legacyHtml,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "city,page_name" }
              );
            }
          } catch (e: any) {
            console.warn("[ai.desc] legacy->supabase sync failed", e?.message);
          }
          return legacyHtml;
        }
      }
    } catch (e: any) {
      if (!/relation .* does not exist/i.test(e.message || ""))
        console.warn("[ai.desc] legacy pg lookup error", e.message);
    }
  }

  // 2.5 memCache fallback: if we already have a runtime value, return it but also ensure Supabase is updated
  if (
    !opts.forceRegenerate &&
    !process.env.FORCE_AI_REGEN &&
    memCache.has(key)
  ) {
    const cached = memCache.get(key);
    const isPh = isPlaceholderHtml(cached);
    if (trace)
      console.log("[ai.desc] memCache hit (post-lookup)", {
        key,
        isPlaceholder: isPh,
        willSyncSupabase: !isPh,
      });
    if (isPh) {
      console.warn(
        "[ai.desc] cached value is placeholder; proceeding to regenerate",
        { key }
      );
    } else {
      try {
        const sb3 = getSupabase();
        if (sb3 && cached) {
          await sb3.from("landing_pages").upsert(
            {
              city: loweredCity,
              page_name: kind,
              kind,
              content: cached,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "city,page_name" }
          );
        }
      } catch (e: any) {
        console.warn(
          "[ai.desc] supabase upsert (from memCache) failed",
          e?.message
        );
      }
      return cached;
    }
  }

  const executor = async (): Promise<string | undefined> => {
    // 3. Generate (requires OpenAI key)
    // During build phase we skip OpenAI (already handled at top of function)
    // At runtime, we can generate if OpenAI key is available
    // Optionally, users can set SKIP_LANDING_EXTERNAL_FETCHES=1 to disable this at runtime too
    if (
      process.env.SKIP_LANDING_EXTERNAL_FETCHES === "1" ||
      !process.env.OPENAI_API_KEY
    ) {
      console.warn("[ai.desc] ⚠️ Skipping OpenAI generation", {
        reason: !process.env.OPENAI_API_KEY
          ? "Missing API key"
          : "SKIP_LANDING_EXTERNAL_FETCHES=1",
        city: loweredCity,
        kind,
      });
      return undefined;
    }

    const prompt =
      opts.customPrompt || buildPrompt(city, kind, opts.customPrompt);

    console.log("[ai.desc] 📝 Preparing OpenAI call", {
      key,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      usedCustomPrompt: !!opts.customPrompt,
      promptLength: prompt.length,
      promptPreview: prompt.slice(0, 200) + "...",
    });

    let html: string | undefined;
    let usedFallback = false; // ✅ Add this line
    try {
      // compute desired words range (min 1200, max 2000 for better content) - env overrides allowed
      const envMin = Number(process.env.LANDING_MIN_WORDS || 1200);
      const envMax = Number(process.env.LANDING_MAX_WORDS || 2000);
      const desiredMin = Math.max(1200, Math.min(envMin, envMax));
      const desiredMax = Math.max(desiredMin, envMax);

      console.log("[ai.desc] 📊 Target word count", { desiredMin, desiredMax });

      // translate words -> approximate tokens (conservative multiplier) using desiredMax
      const approxTokens = Math.max(800, Math.ceil(desiredMax * 1.8));

      console.log("[ai.desc] 🔢 Token budget", { approxTokens });

      // Ask OpenAI with token budget tuned to desiredMax words
      html = await callOpenAI(prompt, approxTokens);

      // Explicit log of content preview for debugging
      console.log("[ai.desc] 📄 OpenAI raw response", {
        key,
        hasContent: !!html,
        length: html?.length || 0,
        preview: (html || "").slice(0, 300) + "...",
      });

      // Count words
      const countWords = (s?: string) => {
        if (!s) return 0;
        const stripped = String(s).replace(/<[^>]+>/g, " ");
        return String(stripped).split(/\s+/).filter(Boolean).length;
      };

      // Check for repetitive content
      const checkRepetition = (text: string): boolean => {
        const stripped = text.replace(/<[^>]+>/g, " ").toLowerCase();
        const sentences = stripped
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 20);
        const uniqueSentences = new Set(sentences.map((s) => s.trim()));
        const repetitionRatio = uniqueSentences.size / sentences.length;
        const isRepetitive = repetitionRatio < 0.75;
        console.log("[ai.desc] 🔍 Repetition check", {
          totalSentences: sentences.length,
          uniqueSentences: uniqueSentences.size,
          repetitionRatio: repetitionRatio.toFixed(2),
          isRepetitive,
        });
        return isRepetitive;
      };

      if (html && checkRepetition(html)) {
        console.warn("[ai.desc] ⚠️ Detected repetitive content, will retry", {
          key,
        });
        html = undefined; // Force retry
      }

      let words = countWords(html);
      console.log("[ai.desc] 📊 Initial word count", {
        words,
        desiredMin,
        desiredMax,
      });

      // If model produced more than desiredMax, truncate safely by paragraphs
      if (words > desiredMax) {
        console.warn("[ai.desc] ✂️ Content exceeds max, truncating", {
          key,
          produced: words,
          max: desiredMax,
        });
        html = truncateHtmlByParagraphs(html || "", desiredMax);
        words = countWords(html);
        console.log("[ai.desc] 📊 Truncated word count", { words });
      }

      // If under desiredWords, retry as before (kept existing retry logic)...
      const maxRetries = 2;
      if (words < desiredMin) {
        console.warn("[ai.desc] 📉 Content below minimum, will retry", {
          words,
          desiredMin,
          maxRetries,
        });
        for (
          let attempt = 1;
          attempt <= maxRetries && words < desiredMin;
          attempt++
        ) {
          try {
            const retryPrompt =
              (opts.customPrompt || prompt) +
              `\n\nIMPORTANT: Output at least ${desiredMin} words and at most ${desiredMax} words. Structure the response as multiple paragraphs (use <p>...</p> for each paragraph). Start with an introductory paragraph, then provide several sections covering neighborhood, market trends, buyer appeal, amenities, and a closing CTA. Avoid fabricated numeric facts. Output HTML paragraphs only.`;
            console.log("[ai.desc] 🔄 Retry attempt", {
              attempt,
              desiredMin,
              desiredMax,
            });
            const retryHtml = await callOpenAI(retryPrompt, approxTokens);
            if (retryHtml) {
              // if retry overproduces, truncate
              if (countWords(retryHtml) > desiredMax) {
                console.warn(
                  "[ai.desc] ✂️ Retry produced too many words, truncating",
                  {
                    attempt,
                    words: countWords(retryHtml),
                    max: desiredMax,
                  }
                );
                html = truncateHtmlByParagraphs(retryHtml, desiredMax);
              } else {
                html = retryHtml;
              }
              words = countWords(html);
              console.log("[ai.desc] ✅ Retry produced content", {
                attempt,
                words,
              });
            } else {
              console.warn("[ai.desc] ⚠️ Retry returned empty", { attempt });
            }
          } catch (e: any) {
            console.error("[ai.desc] ❌ Retry attempt failed", {
              attempt,
              error: e?.message || e,
            });
          }
        }
      }
    } catch (e: any) {
      console.error("[ai.desc] ❌ OpenAI generation failed", {
        error: e.message,
        status: e?.status,
        type: e?.type,
      });
      html = undefined;
    }

    // if (!html || !html.trim()) {
    //   console.warn('[ai.desc] ⚠️ OpenAI returned empty content, using fallback generator', { key })
    //   html = buildFallbackDescription(city, kind)
    // }

    if (!html || !html.trim()) {
      console.warn(
        "[ai.desc] ⚠️ OpenAI returned empty content, using fallback generator",
        { key }
      );
      html = buildFallbackDescription(city, kind);
      usedFallback = true;
    }

    // Ensure paragraphs are wrapped as HTML
    if (html) {
      html = ensureParagraphHtml(html || "");
      console.log("[ai.desc] ✅ HTML paragraphs ensured", {
        length: html.length,
      });
    }

    // After retries above, enforce long fallback if still too short (but now capped)
    const finalDesiredWords = Number(
      process.env.LANDING_MAX_WORDS || process.env.LANDING_MIN_WORDS || 1200
    );
    const finalWordCount = (html || "")
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;

    console.log("[ai.desc] 📊 Final content check", {
      wordCount: finalWordCount,
      targetWords: finalDesiredWords,
    });

    if (
      !usedFallback &&
      html &&
      html.length &&
      finalWordCount > finalDesiredWords
    ) {
      // double-safety: if anything still exceeds, truncate
      console.warn("[ai.desc] ✂️ Final truncation", {
        wordCount: finalWordCount,
        max: finalDesiredWords,
      });
      html = truncateHtmlByParagraphs(html || "", finalDesiredWords);
    }

    // Normalize memCache to always store a string and avoid undefined.
    memCache.set(key, html || "");
    console.log("[ai.desc] ✅ Content generation complete", {
      key,
      length: html?.length || 0,
      finalWordCount: (html || "")
        .replace(/<[^>]+>/g, " ")
        .split(/\s+/)
        .filter(Boolean).length,
    });

    // 4. Persist to Supabase
    try {
      const sb = getSupabase();
      if (sb) {
        if (trace)
          console.log("[ai.desc] persisting supabase", {
            key,
            willPersist: !isPlaceholderHtml(html),
          });
        const usingService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!isPlaceholderHtml(html) && html) {
          const { error } = await sb
            .from("landing_pages")
            .upsert(
              {
                city: loweredCity,
                page_name: kind,
                kind,
                content: html,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "city,page_name" }
            );
          if (error) {
            console.warn("[ai.desc] supabase upsert failed", {
              key,
              msg: error.message,
              code: error.code,
              hint: error.hint,
              serviceRole: usingService,
            });
          } else if (trace) {
            console.log("[ai.desc] supabase upsert ok", key);
          }
        } else {
          console.warn(
            "[ai.desc] skipping supabase persist due to placeholder content",
            { key }
          );
        }
      }
    } catch (e: any) {
      console.warn("[ai.desc] supabase persist exception", e.message);
    }

    // 5. Legacy PG persistence
    try {
      const pool2 = await getPgPool();
      await ensureLegacyTable(pool2);
      if (!isPlaceholderHtml(html) && html) {
        await pool2.query(
          "INSERT INTO landing_ai_descriptions(city,kind,html) VALUES($1,$2,$3) ON CONFLICT (city,kind) DO UPDATE SET html=EXCLUDED.html, generated_at=now()",
          [loweredCity, kind, html]
        );
      } else if (trace) {
        console.log("[ai.desc] skipping legacy pg persist due to placeholder", {
          key,
        });
      }
    } catch (e: any) {
      if (!/relation .* does not exist/i.test(e.message || ""))
        console.warn("[ai.desc] legacy pg persist failed", e.message);
    }
    return html;
  };

  const p = executor().finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}

// The single callOpenAI implementation with optional maxTokens lives earlier in this file.

// escapeHtml already defined above; do not duplicate.

/**
 * Generate Landing Page JSON using the SEO Content Generator Prompt
 * @param inputJson - Input data containing city, filter, neighborhoods, internal links, etc.
 * @returns Generated landing page content in JSON format matching the required schema
 */
export async function generateLandingPageJSON(inputJson: any): Promise<any> {
  console.log("[generateLandingPageJSON] Starting generation", {
    city: inputJson.city,
    filter: inputJson.filter_label,
  });

  // Validate input
  if (!inputJson.city || !inputJson.filter_label) {
    throw new Error(
      "Input must contain at least city and filter_label properties"
    );
  }

  // Build the complete prompt
  const fullPrompt = `${SEO_CONTENT_GENERATOR_PROMPT}\n\nINPUT JSON:\n${JSON.stringify(
    inputJson,
    null,
    2
  )}\n\nGenerate the landing page content as valid JSON matching the required output structure exactly.`;

  try {
    // Call OpenAI with the prompt
    const response = await callOpenAI(fullPrompt, 4000);

    if (!response) {
      throw new Error("OpenAI returned empty response");
    }

    console.log("[generateLandingPageJSON] Raw OpenAI response preview:", {
      length: response.length,
      preview: response.slice(0, 200),
    });

    // Extract JSON from response (in case it's wrapped in markdown code blocks)
    let jsonText = response.trim();

    // Remove markdown code fences if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error("[generateLandingPageJSON] JSON parse error", {
        error: parseError.message,
        jsonPreview: jsonText.slice(0, 500),
      });
      throw new Error(`Failed to parse generated JSON: ${parseError.message}`);
    }

    // Validate required top-level keys
    const requiredKeys = [
      "seo",
      "page_intro",
      "toc",
      "sections",
      "faq",
      "internal_linking",
      "trust",
      "schema_jsonld",
    ];
    const missingKeys = requiredKeys.filter((key) => !parsedData[key]);

    if (missingKeys.length > 0) {
      console.error(
        "[generateLandingPageJSON] Missing required keys:",
        missingKeys
      );
      throw new Error(
        `Generated JSON is missing required keys: ${missingKeys.join(", ")}`
      );
    }

    // Validate SEO title and meta_description lengths
    if (parsedData.seo.title && parsedData.seo.title.length > 60) {
      console.warn("[generateLandingPageJSON] Title exceeds 60 characters", {
        length: parsedData.seo.title.length,
        title: parsedData.seo.title,
      });
      parsedData.seo.title = parsedData.seo.title.substring(0, 57) + "...";
    }

    if (
      parsedData.seo.meta_description &&
      parsedData.seo.meta_description.length > 155
    ) {
      console.warn(
        "[generateLandingPageJSON] Meta description exceeds 155 characters",
        {
          length: parsedData.seo.meta_description.length,
          description: parsedData.seo.meta_description,
        }
      );
      parsedData.seo.meta_description =
        parsedData.seo.meta_description.substring(0, 152) + "...";
    }

    // Validate FAQ count (8-12 items)
    if (!parsedData.faq || parsedData.faq.length < 8) {
      console.warn(
        "[generateLandingPageJSON] FAQ has fewer than 8 items",
        parsedData.faq?.length || 0
      );
    }

    if (parsedData.faq && parsedData.faq.length > 12) {
      console.warn(
        "[generateLandingPageJSON] FAQ has more than 12 items, truncating",
        parsedData.faq.length
      );
      parsedData.faq = parsedData.faq.slice(0, 12);
    }

    console.log("[generateLandingPageJSON] ✅ Successfully generated content", {
      city: inputJson.city,
      filter: inputJson.filter_label,
      sections: parsedData.sections?.length || 0,
      faqs: parsedData.faq?.length || 0,
      titleLength: parsedData.seo.title?.length || 0,
      metaLength: parsedData.seo.meta_description?.length || 0,
    });

    return parsedData;
  } catch (error: any) {
    console.error("[generateLandingPageJSON] Generation failed", {
      error: error.message,
      stack: error.stack,
      city: inputJson.city,
      filter: inputJson.filter_label,
    });
    throw error;
  }
}

/**
 * Generate multiple landing pages in batch
 * @param inputs - Array of input JSON objects
 * @returns Array of generated landing page JSONs
 */
export async function generateBatchLandingPages(
  inputs: any[]
): Promise<any[]> {
  console.log("[generateBatchLandingPages] Starting batch generation", {
    count: inputs.length,
  });

  const results: any[] = [];
  const errors: any[] = [];

  for (const input of inputs) {
    try {
      const result = await generateLandingPageJSON(input);
      results.push(result);

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error("[generateBatchLandingPages] Failed for input", {
        city: input.city,
        filter: input.filter_label,
        error: error.message,
      });
      errors.push({ input, error: error.message });
    }
  }

  console.log("[generateBatchLandingPages] Batch complete", {
    successful: results.length,
    failed: errors.length,
  });

  if (errors.length > 0) {
    console.error("[generateBatchLandingPages] Errors:", errors);
  }

  return results;
}
