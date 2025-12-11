/**
 * AI Module - Barrel Export
 * =========================
 * Central export point for all AI-related functionality.
 */

// Landing page generation
export {
  BASE_PROMPT,
  USER_PROMPT_TEMPLATE,
  generateLandingPageContent,
  generateBatchLandingPages,
  buildUserPrompt,
  buildInputJson,
  LandingPageContentSchema,
  type LandingPageContent,
  type InputJson,
  type BuildInputJsonOptions,
} from "./landing";

// Page type configurations
export {
  PAGE_TYPES,
  PAGE_TYPE_BY_SLUG,
  getPageTypeBySlug,
  getAllPageTypeSlugs,
  isValidPageTypeSlug,
  type PageTypeConfig,
  type PageTypeSlug,
} from "./pageTypes";
