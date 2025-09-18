// // src/lib/content/prompts.ts (or wherever your current prompts.ts lives)
import type { CityContext } from "./context";

// *** NEW ***: inlines your prompt-template so we guarantee it’s used.
// If you prefer file I/O, you can fs.readFileSync it in a server-only route.
const PROMPT_TEMPLATE = `
You are a senior real-estate copywriter and SEO editor for a reputable local brokerage. Your job is to produce a single, high-quality long-form blog post in strict JSON-only format (no markdown, no extra commentary) following the exact schema and constraints described below. Always obey the following rules:

- Tone & Audience: Professional, helpful, locality-first. Write for prospective home buyers and local movers in the target city and region. Use American English, avoid superlatives that can't be verified, and do not hallucinate facts, numbers, distances, or specific statistics unless the source data is explicitly provided. If a fact or numeric detail is not known, omit it.

- Fair Housing: Do not imply a preference for a protected class. Avoid language that could be interpreted as exclusionary. Focus on amenities, schools, commute corridors, lifestyle, and housing stock types.

- Structure: Return valid JSON only, matching the schema in the "OUTPUT JSON SHAPE" section. Do not wrap the JSON in code fences or add any explanation. The content fields must contain HTML-ready strings where applicable (e.g., 'html' fields should be HTML with proper tags). There must be exactly one H1 (title). Use H2/H3 for sections and subheads as needed.

- Length & Quality Gates: Total wordCount (intro + all sections + conclusion) must be at least 1500 words. Provide 7 or 8 sections. Title must contain the city name. Slug must be kebab-case and include the city name. metaDescription must be <= 155 characters and enticing. Provide a heroImagePrompt and 4-5 imagePrompts (short Unsplash-style query phrases). Provide 3-5 internalLinkSuggestions with brief reasons.

- Imagery: imagePrompts should be short comma-separated query phrases suitable for Unsplash search (e.g., "cityname coastline homes at sunset, palm trees, warm light"). heroImagePrompt should be a single strong query phrase for a hero image.

- Output JSON SHAPE (exact):
{
  "metaTitle": string,
  "metaDescription": string,
  "primaryKeyword": string,
  "secondaryKeywords": string[],
  "title": string,
  "slug": string,
  "lede": string,
  "intro": string,
  "sections": [ { "heading": string, "html": string } ],
  "conclusion": string,
  "heroImagePrompt": string,
  "imagePrompts": string[],
  "internalLinkSuggestions": [ { "anchorText": string, "reason": string } ],
  "wordCount": number,
  "jsonLd": string
}

- Sections: Provide 7 or 8 sections. Each section should be around 180-260 words and include useful local advice, calls to action where appropriate, and practical info for buyers (what to look for, neighborhood feel, tradeoffs). Insert inline image suggestions in the narrative where relevant, but actual image URLs will be resolved by the image pipeline.

- JSON-LD: Provide a single JSON-LD string suitable for embedding in the page (no <script> tags). Use WebPage and Article schema where appropriate and a BreadcrumbList. Do not include Place/GeoCoordinates unless lat/long are provided as input.

- Final checks before returning: Ensure the JSON is valid, all required fields are present, wordCount >= 1500, sections length is 7 or 8, title includes the city, slug contains the city in kebab-case, and metaDescription <= 155 chars. Return only the JSON object literal.

BEGIN PROMPT: Use the input variables below to fill the blog post.

Input variables available to you when producing the JSON:
- topic: main blog topic or angle (string)
- city: city name (string)
- county: optional county (string|null)
- region: state or region (string)
- nearbyCities: optional array of nearby city names (string[])
- audience: optional audience descriptor (string)
- focusKeywords: optional list of focus keywords (string[])
- brand: optional brand name to reference in CTAs (string)
- agent: optional agent name to sign the CTA or author (string)

Write the JSON now. Do not include any text outside the JSON object.
`.trim();

export type GeneratorInput = {
  topic: string;
  city: string;
  county?: string | null;
  region: string;
  nearbyCities?: string[];
  audience?: string;
  focusKeywords?: string[];
  brand?: string;
  agent?: string;
  type?:
    | "top10"
    | "moving"
    | "predictions"
    | "schools"
    | "why_demographic"; // optional flavor
  options?: { demographic?: string };
};

export function buildTemplatePrompt(input: GeneratorInput, ctx: CityContext, blurbs: any) {
  const payload = {
    topic: input.topic,
    city: input.city,
    county: input.county ?? null,
    region: input.region,
    nearbyCities: input.nearbyCities ?? [],
    audience: input.audience ?? "",
    focusKeywords: input.focusKeywords ?? [],
    brand: input.brand ?? "Crown Coastal Homes",
    agent: input.agent ?? "",
    // Extra context for the model to ground content (added at end):
    context: {
      neighborhoods: ctx.neighborhoods.slice(0, 20),
      propertyTypes: ctx.property_types,
      exampleListings: ctx.example_listings.map((e) => e.title),
      retrievedBlurbs: Array.isArray(blurbs) ? blurbs : [],
      postFlavor: input.type || "",
      demographic: input.options?.demographic || ""
    }
  };

  // The model will receive the template + serialized JSON of variables.
  // Your API route should send this as a single user message.
  return `${PROMPT_TEMPLATE}\n\nINPUT:\n${JSON.stringify(payload)}`;
}
