import { chatJSON } from "./openai"

export type Intent =
  | "search_properties"
  | "neighborhood_info"
  | "market_analysis"
  | "buying_process"
  | "mortgage_calc"
  | "schedule_viewing"
  | "lead_capture"
  | "general_faq"
  | "handoff_agent"

export type IntentResult = { intent: Intent; entities: Record<string, any> }

export async function classifyIntent(utterance: string): Promise<IntentResult> {
  const sys = `Classify into one of:
  search_properties, neighborhood_info, market_analysis, buying_process, mortgage_calc,
  schedule_viewing, lead_capture, general_faq, handoff_agent.
  Extract entities: city,beds,baths,price_min,price_max,when (ISO),language,name,email,phone,property_id,
  rate,years,down_payment,hoa,property_tax_annual,home_insurance_annual,pmi_monthly.
  If user mentions comparisons, also include arrays when possible: rates (number[]), years_options (number[]).
  Return JSON {intent, entities}.`
  try {
    return await chatJSON([
      { role: "system", content: sys },
      { role: "user", content: utterance },
    ], { schemaHint: "{intent:string,entities:object}", max: 220 })
  } catch (err) {
    // Fallback: simple heuristic to avoid 500s if model returns non-JSON
    const text = (utterance || "").toLowerCase()
    const looksLikeSearch = /(bed|bath|sqft|price|budget|under|over|above|below|million|\bk\b|pool|in\s+[a-z])/i.test(text)
    const intent: Intent = looksLikeSearch ? "search_properties" : "general_faq"
    return { intent, entities: {} }
  }
}
