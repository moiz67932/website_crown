/**
 * Page Type Configurations for Landing Pages
 * ===========================================
 * Central configuration for all page types supported by the landing page generator.
 * 
 * Each page type defines:
 * - PAGE_TYPE_SLUG: URL slug (e.g., "homes-for-sale")
 * - PRIMARY_INTENT: Main search intent phrase with {{city}} placeholder
 * - SYN1, SYN2, SYN3: Synonym phrases for SEO rotation
 * 
 * IMPORTANT: These configurations match the client's specifications exactly.
 * The {{city}} placeholders will be replaced with the actual city name at runtime.
 */

/**
 * PageTypeConfig - Shape of each page type configuration
 */
export interface PageTypeConfig {
  PAGE_TYPE_SLUG: string;
  PRIMARY_INTENT: string;
  SYN1: string;
  SYN2: string;
  SYN3: string;
}

/**
 * PAGE_TYPES - All supported page type configurations
 * 
 * Note: {{city}} placeholders in PRIMARY_INTENT and synonyms will be replaced
 * by the actual city name when building the prompt.
 */
export const PAGE_TYPES = {
  /**
   * Homes for Sale - General residential listings
   */
  HOMES_FOR_SALE: {
    PAGE_TYPE_SLUG: "homes-for-sale",
    PRIMARY_INTENT: "{{city}} homes for sale",
    SYN1: "real estate in {{city}}",
    SYN2: "houses in {{city}}",
    SYN3: "properties for sale in {{city}}",
  } satisfies PageTypeConfig,

  /**
   * Condos for Sale - Condominium listings
   */
  CONDOS_FOR_SALE: {
    PAGE_TYPE_SLUG: "condos-for-sale",
    PRIMARY_INTENT: "{{city}} condos for sale",
    SYN1: "condominiums in {{city}}",
    SYN2: "{{city}} condo market",
    SYN3: "condo properties in {{city}}",
  } satisfies PageTypeConfig,

  /**
   * Homes with Pool - Properties featuring pools
   */
  HOMES_WITH_POOL: {
    PAGE_TYPE_SLUG: "homes-with-pool",
    PRIMARY_INTENT: "{{city}} homes with pool",
    SYN1: "pool homes in {{city}}",
    SYN2: "houses with pools in {{city}}",
    SYN3: "properties with swimming pools in {{city}}",
  } satisfies PageTypeConfig,

  /**
   * Luxury Homes - High-end properties
   */
  LUXURY_HOMES: {
    PAGE_TYPE_SLUG: "luxury-homes",
    PRIMARY_INTENT: "{{city}} luxury homes",
    SYN1: "luxury real estate in {{city}}",
    SYN2: "high-end homes in {{city}}",
    SYN3: "premium properties in {{city}}",
  } satisfies PageTypeConfig,

  /**
   * Homes Under $500K - Affordable housing segment
   */
  HOMES_UNDER_500K: {
    PAGE_TYPE_SLUG: "homes-under-500k",
    PRIMARY_INTENT: "{{city}} homes under $500k",
    SYN1: "affordable homes in {{city}}",
    SYN2: "houses under $500,000 in {{city}}",
    SYN3: "budget-friendly properties in {{city}}",
  } satisfies PageTypeConfig,

  /**
   * Homes Over $1M - Million-dollar+ properties
   */
  HOMES_OVER_1M: {
    PAGE_TYPE_SLUG: "homes-over-1m",
    PRIMARY_INTENT: "{{city}} homes over $1M",
    SYN1: "$1M+ homes in {{city}}",
    SYN2: "million-dollar homes in {{city}}",
    SYN3: "premium real estate in {{city}}",
  } satisfies PageTypeConfig,

  /**
   * 2 Bedroom Apartments - Specific bedroom count
   */
  TWO_BEDROOM_APARTMENTS: {
    PAGE_TYPE_SLUG: "2-bedroom-apartments",
    PRIMARY_INTENT: "{{city}} 2 bedroom apartments",
    SYN1: "two bedroom condos in {{city}}",
    SYN2: "2-bed units in {{city}}",
    SYN3: "two bedroom properties in {{city}}",
  } satisfies PageTypeConfig,
} as const;

/**
 * Get page type config by slug
 * @param slug - The URL slug (e.g., "homes-for-sale")
 * @returns PageTypeConfig or undefined if not found
 */
export function getPageTypeBySlug(slug: string): PageTypeConfig | undefined {
  return Object.values(PAGE_TYPES).find(
    (config) => config.PAGE_TYPE_SLUG === slug
  );
}

/**
 * Get all page type slugs
 * @returns Array of all supported slugs
 */
export function getAllPageTypeSlugs(): string[] {
  return Object.values(PAGE_TYPES).map((config) => config.PAGE_TYPE_SLUG);
}

/**
 * Map from slug to PAGE_TYPES key for easy lookup
 */
export const PAGE_TYPE_BY_SLUG: Record<string, PageTypeConfig> = {
  "homes-for-sale": PAGE_TYPES.HOMES_FOR_SALE,
  "condos-for-sale": PAGE_TYPES.CONDOS_FOR_SALE,
  "homes-with-pool": PAGE_TYPES.HOMES_WITH_POOL,
  "luxury-homes": PAGE_TYPES.LUXURY_HOMES,
  "homes-under-500k": PAGE_TYPES.HOMES_UNDER_500K,
  "homes-over-1m": PAGE_TYPES.HOMES_OVER_1M,
  "2-bedroom-apartments": PAGE_TYPES.TWO_BEDROOM_APARTMENTS,
};

/**
 * Type for valid page type slugs
 */
export type PageTypeSlug = keyof typeof PAGE_TYPE_BY_SLUG;

/**
 * Check if a slug is a valid page type
 * @param slug - The slug to check
 * @returns boolean
 */
export function isValidPageTypeSlug(slug: string): slug is PageTypeSlug {
  return slug in PAGE_TYPE_BY_SLUG;
}
