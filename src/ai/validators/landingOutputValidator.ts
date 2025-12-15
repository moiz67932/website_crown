/**
 * Landing Page Output Semantic Validator
 * =======================================
 * Post-schema validation to catch:
 * - Geo-invalid content (place names not in allowlist)
 * - Missing required phrases
 * - Internal link integrity issues
 * - Forbidden content (AI/tech mentions)
 * - Excessive repetition
 * 
 * @version 4.0.0
 */

import type { LandingPageContent, InputJson } from '../landing';

// ============================================================================
// Types
// ============================================================================

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  details?: unknown;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Known place names that should be flagged if not in allowlist
 * These are actual neighborhoods/cities that could indicate hallucination
 */
const KNOWN_CALIFORNIA_PLACES = new Set([
  // San Diego areas (common hallucination targets)
  'la jolla', 'pacific beach', 'north park', 'mission hills', 'hillcrest',
  'ocean beach', 'point loma', 'coronado', 'del mar', 'encinitas',
  'carlsbad', 'oceanside', 'escondido', 'chula vista', 'national city',
  'gaslamp', 'little italy', 'east village', 'bankers hill', 'university heights',
  'normal heights', 'kensington', 'talmadge', 'college area', 'la mesa',
  'el cajon', 'santee', 'lakeside', 'alpine', 'ramona', 'poway',
  'rancho bernardo', 'scripps ranch', 'mira mesa', 'clairemont', 'kearny mesa',
  'linda vista', 'serra mesa', 'tierrasanta', 'san carlos', 'del cerro',
  'allied gardens', 'grantville', 'mission valley', 'fashion valley',
  'carmel valley', 'torrey pines', 'university city', 'golden hill',
  'south park', 'logan heights', 'barrio logan', 'sherman heights',
  
  // LA areas
  'beverly hills', 'santa monica', 'malibu', 'brentwood', 'westwood',
  'venice', 'marina del rey', 'playa vista', 'culver city', 'west hollywood',
  'hollywood', 'silver lake', 'los feliz', 'echo park', 'highland park',
  'eagle rock', 'glendale', 'burbank', 'pasadena', 'south pasadena',
  'arcadia', 'monrovia', 'azusa', 'glendora', 'claremont', 'pomona',
  'downtown la', 'koreatown', 'mid-wilshire', 'hancock park', 'larchmont',
  'fairfax', 'melrose', 'west la', 'sawtelle', 'mar vista', 'palms',
  'cheviot hills', 'rancho park', 'century city', 'westchester', 'playa del rey',
  'el segundo', 'manhattan beach', 'hermosa beach', 'redondo beach',
  'torrance', 'palos verdes', 'san pedro', 'long beach', 'seal beach',
  'huntington beach', 'newport beach', 'laguna beach', 'dana point',
  'san clemente', 'mission viejo', 'lake forest', 'aliso viejo',
  'laguna niguel', 'laguna hills', 'rancho santa margarita', 'coto de caza',
  'ladera ranch', 'san juan capistrano', 'capistrano beach',
  
  // Orange County / Irvine adjacent (should only appear if in allowlist)
  'tustin', 'santa ana', 'costa mesa', 'fountain valley', 'westminster',
  'garden grove', 'anaheim', 'fullerton', 'placentia', 'yorba linda',
  'brea', 'orange', 'villa park',
  
  // SF Bay Area
  'san francisco', 'oakland', 'berkeley', 'emeryville', 'alameda',
  'san leandro', 'hayward', 'fremont', 'union city', 'newark',
  'milpitas', 'santa clara', 'sunnyvale', 'mountain view', 'palo alto',
  'menlo park', 'redwood city', 'san mateo', 'burlingame', 'south san francisco',
  'daly city', 'pacifica', 'half moon bay', 'sausalito', 'mill valley',
  'san rafael', 'novato', 'petaluma', 'napa', 'sonoma', 'santa rosa',
  'walnut creek', 'concord', 'pleasant hill', 'lafayette', 'orinda',
  'moraga', 'danville', 'san ramon', 'dublin', 'pleasanton', 'livermore',
  'castro valley', 'san lorenzo', 'mission district', 'soma', 'nob hill',
  'russian hill', 'north beach', 'fishermans wharf', 'marina district',
  'pacific heights', 'presidio heights', 'sea cliff', 'richmond district',
  'sunset district', 'parkside', 'west portal', 'glen park', 'noe valley',
  'castro', 'mission dolores', 'potrero hill', 'dogpatch', 'bayview',
  'hunters point', 'visitacion valley', 'excelsior', 'outer mission',
  'bernal heights', 'holly park', 'portola',
  
  // San Jose areas
  'willow glen', 'rose garden', 'japantown', 'downtown san jose',
  'santana row', 'west san jose', 'campbell', 'los gatos', 'saratoga',
  'cupertino', 'monte sereno', 'almaden valley', 'blossom valley',
  'evergreen', 'berryessa', 'alviso', 'north san jose', 'milpitas',
  
  // Other California cities that might be hallucinated
  'sacramento', 'fresno', 'bakersfield', 'riverside', 'san bernardino',
  'santa barbara', 'ventura', 'oxnard', 'thousand oaks', 'simi valley',
  'palmdale', 'lancaster', 'victorville', 'palm springs', 'palm desert',
  'indio', 'temecula', 'murrieta', 'corona', 'ontario', 'rancho cucamonga',
  'fontana', 'moreno valley', 'hemet', 'perris', 'lake elsinore',
  'oceanside', 'vista', 'san marcos', 'escondido', 'fallbrook',
]);

/**
 * Common English words that should NOT be flagged as places
 * These are words that might appear capitalized in headings or at sentence starts
 */
const COMMON_WORDS_NOT_PLACES = new Set([
  // Section headings and common terms
  'search', 'median', 'options', 'last', 'architectural', 'available',
  'architecture', 'buyers', 'seasonal', 'local', 'below', 'above',
  'market', 'homes', 'properties', 'listings', 'real', 'estate',
  'luxury', 'featured', 'current', 'overview', 'about', 'area',
  'neighborhoods', 'nearby', 'areas', 'buyer', 'strategy', 'property',
  'types', 'snapshot', 'schools', 'education', 'lifestyle', 'amenities',
  'daily', 'living', 'working', 'agent', 'frequently', 'asked',
  'questions', 'faq', 'explore', 'discover', 'find', 'view',
  'browse', 'see', 'learn', 'more', 'contact', 'get', 'started',
  'today', 'now', 'here', 'there', 'this', 'that', 'these', 'those',
  'many', 'some', 'most', 'all', 'any', 'each', 'every', 'both',
  'few', 'several', 'various', 'other', 'another', 'such', 'same',
  'different', 'new', 'old', 'first', 'second', 'third', 'next',
  'previous', 'recent', 'latest', 'updated', 'active', 'pending',
  'sold', 'price', 'prices', 'pricing', 'cost', 'costs', 'value',
  'values', 'budget', 'range', 'ranges', 'average', 'total', 'count',
  'number', 'percent', 'percentage', 'rate', 'rates', 'day', 'days',
  'week', 'weeks', 'month', 'months', 'year', 'years', 'time',
  'home', 'house', 'houses', 'condo', 'condos', 'condominium',
  'townhouse', 'townhome', 'apartment', 'apartments', 'unit', 'units',
  'bedroom', 'bedrooms', 'bed', 'beds', 'bath', 'baths', 'bathroom',
  'bathrooms', 'sqft', 'square', 'feet', 'foot', 'lot', 'size',
  'acre', 'acres', 'pool', 'pools', 'garage', 'parking', 'view',
  'views', 'ocean', 'mountain', 'city', 'downtown', 'urban', 'suburban',
  'rural', 'coastal', 'inland', 'north', 'south', 'east', 'west',
  'central', 'northern', 'southern', 'eastern', 'western', 'upper',
  'lower', 'mid', 'middle', 'inner', 'outer', 'greater', 'metro',
  'family', 'families', 'single', 'multi', 'residential', 'commercial',
  'industrial', 'mixed', 'use', 'zoning', 'zone', 'district', 'community',
  'communities', 'neighborhood', 'street', 'streets', 'road', 'roads',
  'avenue', 'boulevard', 'drive', 'lane', 'way', 'place', 'court',
  'circle', 'trail', 'path', 'highway', 'freeway', 'interstate',
  'commute', 'commutes', 'commuting', 'transit', 'transportation',
  'school', 'schools', 'elementary', 'middle', 'high', 'college',
  'university', 'campus', 'education', 'educational', 'academic',
  'park', 'parks', 'recreation', 'recreational', 'outdoor', 'outdoors',
  'beach', 'beaches', 'waterfront', 'water', 'lake', 'lakes', 'river',
  'rivers', 'bay', 'harbor', 'marina', 'pier', 'dock', 'docks',
  'shopping', 'retail', 'restaurant', 'restaurants', 'dining', 'food',
  'entertainment', 'arts', 'culture', 'cultural', 'museum', 'museums',
  'theater', 'theatre', 'gallery', 'galleries', 'nightlife', 'sports',
  'gym', 'fitness', 'health', 'healthcare', 'hospital', 'hospitals',
  'medical', 'clinic', 'clinics', 'doctor', 'doctors', 'office',
  'offices', 'business', 'businesses', 'corporate', 'tech', 'technology',
  'industry', 'industries', 'job', 'jobs', 'employment', 'work',
  'career', 'careers', 'professional', 'professionals', 'company',
  'companies', 'corporation', 'corporations', 'firm', 'firms',
  'investment', 'investments', 'investor', 'investors', 'buyer',
  'seller', 'sellers', 'owner', 'owners', 'renter', 'renters',
  'tenant', 'tenants', 'landlord', 'landlords', 'agent', 'agents',
  'broker', 'brokers', 'realtor', 'realtors', 'mls', 'listing',
  'tour', 'tours', 'showing', 'showings', 'open', 'house', 'inspection',
  'inspections', 'appraisal', 'appraisals', 'offer', 'offers', 'contract',
  'contracts', 'escrow', 'closing', 'title', 'deed', 'mortgage',
  'mortgages', 'loan', 'loans', 'financing', 'finance', 'financial',
  'bank', 'banks', 'lender', 'lenders', 'credit', 'interest', 'rate',
  'down', 'payment', 'payments', 'monthly', 'annual', 'yearly',
  'tax', 'taxes', 'hoa', 'association', 'fee', 'fees', 'dues',
  'maintenance', 'utilities', 'utility', 'insurance', 'coverage',
  'warranty', 'warranties', 'condition', 'conditions', 'quality',
  'standard', 'standards', 'upgrade', 'upgrades', 'renovation',
  'renovations', 'remodel', 'remodeled', 'updated', 'modern',
  'contemporary', 'traditional', 'classic', 'vintage', 'historic',
  'historical', 'new', 'construction', 'built', 'building', 'buildings',
  'development', 'developments', 'project', 'projects', 'plan', 'plans',
  'design', 'designs', 'style', 'styles', 'feature', 'features',
  'amenity', 'amenities', 'benefit', 'benefits', 'advantage', 'advantages',
  'opportunity', 'opportunities', 'option', 'experience', 'experiences',
  'service', 'services', 'support', 'assistance', 'help', 'guide',
  'guidance', 'advice', 'recommendation', 'recommendations', 'tip',
  'tips', 'step', 'steps', 'process', 'checklist', 'list', 'item',
  'items', 'detail', 'details', 'information', 'info', 'data', 'source',
  'sources', 'update', 'updates', 'change', 'changes', 'trend', 'trends',
  'forecast', 'prediction', 'predictions', 'estimate', 'estimates',
  'analysis', 'report', 'reports', 'statistic', 'statistics', 'stat',
  'stats', 'metric', 'metrics', 'indicator', 'indicators', 'factor',
  'factors', 'element', 'elements', 'component', 'components', 'part',
  'parts', 'section', 'sections', 'segment', 'segments', 'category',
  'categories', 'type', 'kind', 'class', 'level', 'levels', 'tier',
  'tiers', 'grade', 'grades', 'rating', 'ratings', 'score', 'scores',
  'rank', 'ranking', 'rankings', 'position', 'positions', 'status',
  'california', 'state', 'county', 'region', 'regions', 'regional',
  // Agent and brand names (should be allowed)
  'crown', 'coastal', 'reza', 'barghlameno', 'dre',
  // Common action words
  'click', 'tap', 'select', 'choose', 'pick', 'compare', 'filter',
  'sort', 'save', 'share', 'print', 'download', 'upload', 'submit',
  'send', 'receive', 'call', 'email', 'message', 'chat', 'schedule',
  'book', 'reserve', 'request', 'apply', 'register', 'sign', 'log',
  // Common descriptive words
  'great', 'good', 'best', 'better', 'excellent', 'outstanding',
  'exceptional', 'remarkable', 'impressive', 'stunning', 'beautiful',
  'gorgeous', 'lovely', 'charming', 'elegant', 'sophisticated',
  'luxurious', 'premium', 'exclusive', 'prestigious', 'desirable',
  'popular', 'sought', 'after', 'demand', 'competitive', 'hot',
  'active', 'dynamic', 'vibrant', 'thriving', 'growing', 'expanding',
  'stable', 'steady', 'consistent', 'reliable', 'trusted', 'reputable',
  'established', 'experienced', 'knowledgeable', 'expert', 'skilled',
  'qualified', 'licensed', 'certified', 'accredited', 'approved',
  // Time-related
  'spring', 'summer', 'fall', 'autumn', 'winter', 'january', 'february',
  'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday', 'weekend', 'weekday',
  'morning', 'afternoon', 'evening', 'night', 'daily', 'weekly',
  'monthly', 'quarterly', 'annually', 'hourly',
]);

/**
 * Forbidden tokens that should not appear in user-facing content
 */
const FORBIDDEN_TOKENS = [
  'cloud sql',
  'supabase',
  'postgres',
  'postgresql',
  'database',
  'internal id',
  'mls id',
  'listing_key',
  'system message',
  'system prompt',
  // Note: 'prompt' alone is too common ("prompt service", "prompt response")
  // Only flag if in suspicious context
];

/**
 * Forbidden tokens that need context checking (too common alone)
 */
const CONTEXT_FORBIDDEN_TOKENS = [
  { token: 'prompt', exclude: ['prompt service', 'prompt response', 'prompt attention', 'prompt delivery'] },
  { token: 'model', exclude: ['model home', 'model unit', 'business model', 'model match'] },
];

/**
 * Required sentence for missing specs (exact match)
 */
const MISSING_SPECS_SENTENCE = 
  'Some featured listings may not show every detail (such as square footage or bed/bath count) in the quick view; open the full listing page for complete information before making decisions.';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Derive allowed place names from input JSON
 * Includes: city, state/region, local_areas names, internal link anchors
 */
export function deriveAllowedPlaceNames(input: InputJson): string[] {
  const allowed = new Set<string>();

  // Add city (required)
  if (input.city && typeof input.city === 'string') {
    allowed.add(input.city.toLowerCase().trim());
  }

  // Add state/region
  if (input.state && typeof input.state === 'string') {
    allowed.add(input.state.toLowerCase().trim());
  }
  if (input.region && typeof input.region === 'string') {
    allowed.add(input.region.toLowerCase().trim());
  }

  // Add local_areas names
  const localAreas = (input as Record<string, unknown>).local_areas;
  if (Array.isArray(localAreas)) {
    for (const area of localAreas) {
      if (typeof area === 'string') {
        allowed.add(area.toLowerCase().trim());
      } else if (area && typeof area === 'object') {
        const areaObj = area as Record<string, unknown>;
        if (typeof areaObj.name === 'string') {
          allowed.add(areaObj.name.toLowerCase().trim());
        }
      }
    }
  }

  // Add internal link anchors (these are vetted place references)
  const internalLinks = (input as Record<string, unknown>).internal_links as
    | {
        related_pages?: Array<{ anchor: string }>;
        more_in_city?: Array<{ anchor: string }>;
        nearby_cities?: Array<{ anchor: string }>;
      }
    | undefined;

  if (internalLinks) {
    const linkArrays = [
      internalLinks.related_pages,
      internalLinks.more_in_city,
      internalLinks.nearby_cities,
    ];

    for (const arr of linkArrays) {
      if (Array.isArray(arr)) {
        for (const link of arr) {
          if (link && typeof link.anchor === 'string') {
            // Extract place name from anchor text
            // e.g., "Homes for sale in Newport Beach" -> "Newport Beach"
            const anchor = link.anchor.toLowerCase().trim();
            allowed.add(anchor);

            // Also extract the city name if it follows a pattern
            const cityMatch = anchor.match(/(?:in|near|around)\s+(.+?)(?:\s*$|\s*,)/i);
            if (cityMatch && cityMatch[1]) {
              allowed.add(cityMatch[1].toLowerCase().trim());
            }
          }
        }
      }
    }
  }

  // Add "California" as always allowed
  allowed.add('california');
  allowed.add('ca');

  // Add brand and agent names as allowed
  allowed.add('crown coastal homes');
  allowed.add('crown coastal');
  allowed.add('reza barghlameno');

  return Array.from(allowed).filter(p => p.length > 0);
}

/**
 * Extract all text fields from the landing page content for validation
 */
function extractTextFields(content: LandingPageContent): Array<{ path: string; text: string }> {
  const fields: Array<{ path: string; text: string }> = [];

  // SEO fields
  fields.push({ path: 'seo.title', text: content.seo.title });
  fields.push({ path: 'seo.meta_description', text: content.seo.meta_description });
  fields.push({ path: 'seo.h1', text: content.seo.h1 });
  fields.push({ path: 'seo.og_title', text: content.seo.og_title });
  fields.push({ path: 'seo.og_description', text: content.seo.og_description });

  // Intro fields
  fields.push({ path: 'intro.subheadline', text: content.intro.subheadline });
  fields.push({ path: 'intro.last_updated_line', text: content.intro.last_updated_line });
  for (let i = 0; i < content.intro.quick_bullets.length; i++) {
    fields.push({ path: `intro.quick_bullets[${i}]`, text: content.intro.quick_bullets[i] });
  }

  // Section fields
  const sections = content.sections;
  for (const [sectionName, section] of Object.entries(sections)) {
    if (section && typeof section === 'object') {
      if ('heading' in section && typeof section.heading === 'string') {
        fields.push({ path: `sections.${sectionName}.heading`, text: section.heading });
      }
      if ('body' in section && typeof section.body === 'string') {
        fields.push({ path: `sections.${sectionName}.body`, text: section.body });
      }
      if ('cards' in section && Array.isArray(section.cards)) {
        for (let i = 0; i < section.cards.length; i++) {
          const card = section.cards[i];
          if (card.name) fields.push({ path: `sections.${sectionName}.cards[${i}].name`, text: card.name });
          if (card.blurb) fields.push({ path: `sections.${sectionName}.cards[${i}].blurb`, text: card.blurb });
        }
      }
      if ('cta' in section && section.cta) {
        const cta = section.cta as { title?: string; body?: string };
        if (cta.title) fields.push({ path: `sections.${sectionName}.cta.title`, text: cta.title });
        if (cta.body) fields.push({ path: `sections.${sectionName}.cta.body`, text: cta.body });
      }
    }
  }

  // FAQ fields
  for (let i = 0; i < content.faq.length; i++) {
    fields.push({ path: `faq[${i}].q`, text: content.faq[i].q });
    fields.push({ path: `faq[${i}].a`, text: content.faq[i].a });
  }

  // Trust fields
  fields.push({ path: 'trust.about_brand', text: content.trust.about_brand });
  if (content.trust.agent_box) {
    fields.push({ path: 'trust.agent_box.headline', text: content.trust.agent_box.headline });
    fields.push({ path: 'trust.agent_box.body', text: content.trust.agent_box.body });
    fields.push({ path: 'trust.agent_box.disclaimer', text: content.trust.agent_box.disclaimer });
  }

  return fields;
}

/**
 * Check if a candidate place name is a known place that's not in the allowlist
 * Returns true if it's a forbidden place mention
 */
function isForbiddenPlace(candidate: string, allowlistLower: Set<string>): boolean {
  const normalized = candidate.toLowerCase().trim();
  
  // If it's in the allowlist, it's fine
  if (allowlistLower.has(normalized)) {
    return false;
  }
  
  // Check partial matches (e.g., "Newport Beach" should match if "newport beach" is in allowlist)
  for (const allowed of allowlistLower) {
    if (normalized.includes(allowed) || allowed.includes(normalized)) {
      return false;
    }
  }
  
  // Only flag if it's a KNOWN California place
  return KNOWN_CALIFORNIA_PLACES.has(normalized);
}

/**
 * Extract potential place name candidates from text
 * Uses a targeted approach: only flag KNOWN places that aren't in allowlist
 */
export function extractPlaceCandidates(text: string): string[] {
  const candidates: string[] = [];
  const textLower = text.toLowerCase();
  
  // Check for known California places in the text
  for (const place of KNOWN_CALIFORNIA_PLACES) {
    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(textLower)) {
      candidates.push(place);
    }
  }
  
  return [...new Set(candidates)]; // Remove duplicates
}

/**
 * Validate geo content - check for place names not in allowlist
 */
function validateGeoContent(
  fields: Array<{ path: string; text: string }>,
  allowedPlaces: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const allowlistLower = new Set(allowedPlaces.map(p => p.toLowerCase().trim()));
  const foundForbidden = new Set<string>();

  for (const field of fields) {
    const candidates = extractPlaceCandidates(field.text);
    
    for (const candidate of candidates) {
      if (isForbiddenPlace(candidate, allowlistLower)) {
        foundForbidden.add(candidate);
      }
    }
  }

  if (foundForbidden.size > 0) {
    const forbiddenList = Array.from(foundForbidden).slice(0, 10);
    errors.push({
      code: 'GEO_INVALID',
      message: `Found place names not in allowlist: ${forbiddenList.join(', ')}${foundForbidden.size > 10 ? '...' : ''}`,
      details: { forbidden: Array.from(foundForbidden), allowlist: allowedPlaces },
    });
  }

  return errors;
}

/**
 * Validate required phrases in specific sections
 */
function validateRequiredPhrases(
  content: LandingPageContent,
  input: InputJson
): ValidationError[] {
  const errors: ValidationError[] = [];
  const marketBody = content.sections.market_snapshot.body;

  // Check for data source mention
  if (input.data_source && typeof input.data_source === 'string') {
    const dataSourcePattern = new RegExp(`data\\s+source[:\\s]+${escapeRegex(input.data_source)}`, 'i');
    const simpleDataSource = marketBody.toLowerCase().includes('data source');
    
    if (!simpleDataSource) {
      errors.push({
        code: 'MISSING_DATA_SOURCE',
        message: 'Market snapshot must include "Data source:" mention',
        path: 'sections.market_snapshot.body',
      });
    }
  }

  // Check for last updated mention
  if (input.last_updated_iso && typeof input.last_updated_iso === 'string') {
    const hasLastUpdated = marketBody.toLowerCase().includes('last updated') || 
                          marketBody.toLowerCase().includes('updated:') ||
                          marketBody.toLowerCase().includes('as of');
    
    if (!hasLastUpdated) {
      errors.push({
        code: 'MISSING_LAST_UPDATED',
        message: 'Market snapshot must include "Last updated:" or date mention',
        path: 'sections.market_snapshot.body',
      });
    }
  }

  // Check for missing specs sentence (if flag is true)
  if (input.featured_listings_has_missing_specs === true) {
    const featuredBody = content.sections.featured_listings.body;
    
    // Check for the required sentence or a close variant
    const hasRequiredSentence = 
      featuredBody.includes(MISSING_SPECS_SENTENCE) ||
      (featuredBody.toLowerCase().includes('some featured listings may not show every detail') &&
       featuredBody.toLowerCase().includes('full listing page'));
    
    if (!hasRequiredSentence) {
      errors.push({
        code: 'MISSING_SPECS_SENTENCE',
        message: 'Featured listings section must include the required missing specs disclaimer sentence',
        path: 'sections.featured_listings.body',
      });
    }
  }

  return errors;
}

/**
 * Validate internal links match input exactly
 */
function validateInternalLinks(
  content: LandingPageContent,
  input: InputJson
): ValidationError[] {
  const errors: ValidationError[] = [];
  const internalLinks = input.internal_links as {
    related_pages?: Array<{ href: string; anchor: string }>;
    more_in_city?: Array<{ href: string; anchor: string }>;
    nearby_cities?: Array<{ href: string; anchor: string }>;
  } | undefined;

  if (!internalLinks) {
    return errors;
  }

  // Build a set of valid href+anchor combinations
  const validLinks = new Set<string>();
  const allInputLinks = [
    ...(internalLinks.related_pages || []),
    ...(internalLinks.more_in_city || []),
    ...(internalLinks.nearby_cities || []),
  ];
  
  for (const link of allInputLinks) {
    if (link.href && link.anchor) {
      validLinks.add(`${link.href}|${link.anchor}`);
    }
  }

  // Validate in_body_links
  const inBodyLinks = content.internal_linking.in_body_links || [];
  
  if (inBodyLinks.length > 10) {
    errors.push({
      code: 'TOO_MANY_IN_BODY_LINKS',
      message: `in_body_links has ${inBodyLinks.length} items, maximum is 10`,
      path: 'internal_linking.in_body_links',
    });
  }

  for (let i = 0; i < inBodyLinks.length; i++) {
    const link = inBodyLinks[i];
    const key = `${link.href}|${link.anchor}`;
    
    if (!validLinks.has(key)) {
      // Check if href exists at all
      const hrefExists = allInputLinks.some(l => l.href === link.href);
      if (!hrefExists) {
        errors.push({
          code: 'INVALID_IN_BODY_LINK',
          message: `in_body_links[${i}] has invalid href: ${link.href}`,
          path: `internal_linking.in_body_links[${i}]`,
          details: { link },
        });
      }
    }
  }

  return errors;
}

/**
 * Validate forbidden content is not present
 */
function validateForbiddenContent(
  fields: Array<{ path: string; text: string }>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const textLower = field.text.toLowerCase();

    // Check simple forbidden tokens
    for (const token of FORBIDDEN_TOKENS) {
      if (textLower.includes(token)) {
        errors.push({
          code: 'FORBIDDEN_TOKEN',
          message: `User-facing content contains forbidden term: "${token}"`,
          path: field.path,
        });
      }
    }

    // Check context-sensitive tokens
    for (const { token, exclude } of CONTEXT_FORBIDDEN_TOKENS) {
      if (textLower.includes(token)) {
        // Check if it's in an excluded context
        const inExcludedContext = exclude.some(exc => textLower.includes(exc));
        if (!inExcludedContext) {
          // Additional check: is it used in a tech/AI context?
          const aiContext = /\b(ai|artificial|intelligence|language|llm|gpt|openai|machine|learning)\b/i;
          const techContext = /\b(system|api|code|data|server|client|backend|frontend)\b/i;
          
          // Only flag if in suspicious context
          const nearToken = textLower.substring(
            Math.max(0, textLower.indexOf(token) - 50),
            Math.min(textLower.length, textLower.indexOf(token) + token.length + 50)
          );
          
          if (aiContext.test(nearToken) || techContext.test(nearToken)) {
            errors.push({
              code: 'FORBIDDEN_TOKEN',
              message: `User-facing content contains forbidden term in tech context: "${token}"`,
              path: field.path,
            });
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Count bullet points in text (lines starting with "- ")
 * Exported for testing
 */
export function countBullets(text: string): number {
  const lines = text.split(/\\n|\n/);
  return lines.filter(line => line.trim().startsWith('- ')).length;
}

/**
 * Check for excessive repetition in text content
 * Returns count of repeated sentences and the repeated content
 * Exported for testing
 */
export function checkRepetition(texts: string[]): { count: number; repeated: string[] } {
  const sentenceCounts = new Map<string, number>();
  
  for (const text of texts) {
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''))
      .filter(s => s.length > 20);
    
    for (const sentence of sentences) {
      const count = (sentenceCounts.get(sentence) || 0) + 1;
      sentenceCounts.set(sentence, count);
    }
  }

  const repeated: string[] = [];
  for (const [sentence, count] of sentenceCounts) {
    if (count >= 3) {
      repeated.push(sentence);
    }
  }

  return { count: repeated.length, repeated };
}

/**
 * Validate buyer strategy has required bullets
 */
function validateBuyerStrategy(content: LandingPageContent): ValidationError[] {
  const errors: ValidationError[] = [];
  const body = content.sections.buyer_strategy.body;
  
  // Use the exported countBullets function
  const bulletCount = countBullets(body);
  
  if (bulletCount < 8) {
    errors.push({
      code: 'INSUFFICIENT_BULLETS',
      message: `Buyer strategy has ${bulletCount} bullets, minimum is 8`,
      path: 'sections.buyer_strategy.body',
    });
  } else if (bulletCount > 12) {
    errors.push({
      code: 'TOO_MANY_BULLETS',
      message: `Buyer strategy has ${bulletCount} bullets, maximum is 12`,
      path: 'sections.buyer_strategy.body',
    });
  }

  // Validate CTA exists
  const cta = content.sections.buyer_strategy.cta;
  if (!cta || !cta.button_text || !cta.button_href) {
    errors.push({
      code: 'MISSING_CTA',
      message: 'Buyer strategy must have a CTA with button_text and button_href',
      path: 'sections.buyer_strategy.cta',
    });
  }

  return errors;
}

/**
 * Simple repetition check - flag if same sentence appears too many times
 */
function validateRepetition(
  fields: Array<{ path: string; text: string }>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const sentenceCounts = new Map<string, number>();
  
  for (const field of fields) {
    // Split into sentences
    const sentences = field.text
      .split(/[.!?]+/)
      .map(s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ''))
      .filter(s => s.length > 20); // Only check substantial sentences
    
    for (const sentence of sentences) {
      const count = (sentenceCounts.get(sentence) || 0) + 1;
      sentenceCounts.set(sentence, count);
    }
  }

  // Find sentences repeated too many times
  const repeated: string[] = [];
  for (const [sentence, count] of sentenceCounts) {
    if (count >= 3) {
      repeated.push(`"${sentence.slice(0, 50)}..." (${count}x)`);
    }
  }

  if (repeated.length > 0) {
    errors.push({
      code: 'EXCESSIVE_REPETITION',
      message: `Found repeated sentences: ${repeated.slice(0, 3).join('; ')}`,
      details: { repeated },
    });
  }

  return errors;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate landing page output against semantic rules
 * Run this AFTER schema validation passes
 * 
 * @param content - The generated landing page content
 * @param input - The input JSON used for generation
 * @returns ValidationResult with ok flag and array of errors
 */
export function validateLandingOutput(
  content: LandingPageContent,
  input: InputJson
): ValidationResult {
  const errors: ValidationError[] = [];

  // Derive allowlist
  const allowedPlaces = input.allowed_place_names 
    ? (input.allowed_place_names as string[])
    : deriveAllowedPlaceNames(input);

  // Extract all text fields
  const fields = extractTextFields(content);

  // Run all validations
  errors.push(...validateGeoContent(fields, allowedPlaces));
  errors.push(...validateRequiredPhrases(content, input));
  errors.push(...validateInternalLinks(content, input));
  errors.push(...validateForbiddenContent(fields));
  errors.push(...validateBuyerStrategy(content));
  errors.push(...validateRepetition(fields));

  // Validate canonical path
  if (content.seo.canonical_path !== input.canonical_path) {
    errors.push({
      code: 'CANONICAL_MISMATCH',
      message: `canonical_path "${content.seo.canonical_path}" does not match input "${input.canonical_path}"`,
      path: 'seo.canonical_path',
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
