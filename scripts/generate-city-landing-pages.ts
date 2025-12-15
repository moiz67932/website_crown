#!/usr/bin/env npx ts-node
/**
 * Generate Landing Pages for CA_CITIES with Full AI Content
 * ==========================================================
 * 
 * This script:
 * 1. Imports cities from src/lib/seo/cities.ts (CA_CITIES)
 * 2. Creates landing pages for all 7 page types per city
 * 3. Generates full AI content using the prompt system (v3 or v4)
 * 4. Skips pages that already exist in the database
 * 5. Stores the generated content in Supabase
 * 
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/generate-city-landing-pages.ts
 *   
 * Or with v4 prompts (semantic validation + repair retry):
 *   npx ts-node --project tsconfig.scripts.json scripts/generate-city-landing-pages.ts --v4
 *   
 * Or add to package.json:
 *   "generate:city-pages": "ts-node --project tsconfig.scripts.json scripts/generate-city-landing-pages.ts"
 * 
 * Options:
 *   --v4            Use v4 prompts with semantic validation and repair retry
 *   --city=<slug>   Only generate for specific city (e.g., --city=irvine)
 *   --type=<slug>   Only generate specific page type (e.g., --type=homes-for-sale)
 *   --force         Regenerate even if page exists
 * 
 * Requirements:
 *   - OPENAI_API_KEY in .env
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   - DATABASE_URL for Cloud SQL (optional, for real market stats)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { CA_CITIES, cityToTitle } from '../src/lib/seo/cities';
import {
  generateLandingPageContent,
  buildInputJson,
  type LandingPageContent,
  type InputJson,
} from '../src/ai/landing';
import {
  generateLandingPageContentV4,
  type GenerationResultV4,
} from '../src/ai/landing.v4';
import {
  PAGE_TYPES,
  PAGE_TYPE_BY_SLUG,
  getAllPageTypeSlugs,
  type PageTypeConfig,
} from '../src/ai/pageTypes';
import type { LandingKind } from '../src/types/landing';

// Load environment variables from .env files
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// CRITICAL: Enable AI generation for CLI scripts
// This bypasses the SSR/ISR protection that normally blocks AI calls
process.env.ALLOW_AI_GENERATION = 'true';

// ============================================================================
// CONFIGURATION & CLI FLAGS
// ============================================================================

// Load environment variables from .env files
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// CRITICAL: Enable AI generation for CLI scripts
// This bypasses the SSR/ISR protection that normally blocks AI calls
process.env.ALLOW_AI_GENERATION = 'true';

// ============================================================================
// CONFIGURATION & CLI FLAGS
// ============================================================================

// Parse CLI arguments
const args = process.argv.slice(2);
const USE_V4 = args.includes('--v4');
const FORCE_REGENERATE = args.includes('--force');
const CITY_FILTER = args.find(a => a.startsWith('--city='))?.split('=')[1];
const TYPE_FILTER = args.find(a => a.startsWith('--type='))?.split('=')[1];

// Rate limiting delay between AI generations (ms) to avoid API rate limits
const GENERATION_DELAY_MS = 2000;

// All 7 page types
const PAGE_TYPE_SLUGS = getAllPageTypeSlugs();

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.error('❌ SUPABASE_URL not set in environment');
    return null;
  }
  
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY not set');
    return null;
  }
  
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert city slug to display name
 * e.g., "los-angeles" -> "Los Angeles"
 */
function slugToDisplayName(slug: string): string {
  return cityToTitle(slug);
}

/**
 * Get local areas/neighborhoods for a city
 * Returns empty array - AI will generate appropriate content dynamically
 */
function getLocalAreas(_city: string): Array<{ name: string; notes?: string }> {
  // No predefined data - let AI generate dynamic content based on the city
  return [];
}

/**
 * Get nearby cities for internal linking
 * Returns empty array - AI will generate appropriate content dynamically
 */
function getNearbyCities(_city: string): string[] {
  // No predefined data - let AI generate dynamic content based on the city
  return [];
}

/**
 * Build internal links structure for a landing page
 */
function buildInternalLinks(city: string, pageType: string, state: string = 'california') {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state.toLowerCase().replace(/\s+/g, '-');
  const cityTitle = slugToDisplayName(citySlug);
  
  // Related pages (other page types in same city)
  const relatedPages = PAGE_TYPE_SLUGS
    .filter(slug => slug !== pageType)
    .slice(0, 3)
    .map(slug => ({
      href: `/${stateSlug}/${citySlug}/${slug}`,
      anchor: `${cityTitle} ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    }));
  
  // More in city (luxury, specific page types)
  const moreInCity = PAGE_TYPE_SLUGS
    .filter(slug => slug !== pageType && !relatedPages.find(p => p.href.includes(slug)))
    .slice(0, 2)
    .map(slug => ({
      href: `/${stateSlug}/${citySlug}/${slug}`,
      anchor: `${cityTitle} ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    }));
  
  // Nearby cities
  const nearbyCityNames = getNearbyCities(city);
  const nearbyCities = nearbyCityNames.slice(0, 3).map(nearbyCity => ({
    href: `/${stateSlug}/${nearbyCity.replace(/\s+/g, '-')}/homes-for-sale`,
    anchor: slugToDisplayName(nearbyCity.replace(/\s+/g, '-')),
  }));
  
  return {
    related_pages: relatedPages,
    more_in_city: moreInCity,
    nearby_cities: nearbyCities,
  };
}

/**
 * Check if a landing page already exists in the database
 */
async function pageExists(
  supabase: SupabaseClient,
  city: string,
  pageType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('id')
    .eq('city', city)
    .eq('page_name', pageType)
    .maybeSingle();
  
  if (error) {
    console.error(`  ⚠️  Error checking existence: ${error.message}`);
    return false;
  }
  
  return !!data;
}

/**
 * Save landing page content to database
 */
async function saveLandingPage(
  supabase: SupabaseClient,
  city: string,
  citySlug: string,
  pageType: string,
  content: LandingPageContent
): Promise<boolean> {
  const { error } = await supabase
    .from('landing_pages')
    .upsert(
      {
        city: city,
        page_name: pageType,
        kind: pageType,
        slug: `california/${citySlug}/${pageType}`,
        state: 'CA',
        title: content.seo.title,
        description: content.seo.meta_description,
        meta_title: content.seo.title,
        meta_description: content.seo.meta_description,
        content: content,
        status: 'draft',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'city,page_name' }
    );
  
  if (error) {
    console.error(`  ❌ Error saving: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * Generate AI content for a single landing page
 * Supports both v3 (legacy) and v4 (semantic validation + repair retry)
 */
async function generatePageContent(
  city: string,
  citySlug: string,
  pageType: string,
  pageTypeConfig: PageTypeConfig
): Promise<{ content: LandingPageContent | null; v4Meta?: GenerationResultV4 }> {
  try {
    // Build input JSON with real or fallback data
    const inputJson: InputJson = await buildInputJson({
      city,
      state: 'CA',
      kind: pageType as LandingKind,
      canonicalPath: `/california/${citySlug}/${pageType}`,
      region: 'California',
      localAreas: getLocalAreas(city),
      internalLinks: buildInternalLinks(city, pageType),
      nearbyCities: getNearbyCities(city),
      debug: false,
    });
    
    if (USE_V4) {
      // V4: Semantic validation + repair retry
      const result = await generateLandingPageContentV4(pageTypeConfig, inputJson);
      return {
        content: result.content,
        v4Meta: result,
      };
    } else {
      // V3: Legacy generation
      const content = await generateLandingPageContent(pageTypeConfig, inputJson);
      return { content };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Generation failed: ${errorMessage}`);
    return { content: null };
  }
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     LANDING PAGE GENERATOR - CA CITIES × ALL PAGE TYPES          ║');
  console.log(`║     Using ${USE_V4 ? 'V4 Prompts (Semantic Validation + Repair)' : 'V3 Prompts (Legacy)'}       ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Show flags
  if (USE_V4) console.log('🔷 V4 mode enabled: semantic validation + repair retry');
  if (FORCE_REGENERATE) console.log('🔶 Force regenerate mode: will overwrite existing pages');
  if (CITY_FILTER) console.log(`🔷 City filter: ${CITY_FILTER}`);
  if (TYPE_FILTER) console.log(`🔷 Type filter: ${TYPE_FILTER}`);

  // Check OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set in environment');
    console.error('   Please add OPENAI_API_KEY to your .env file');
    process.exit(1);
  }
  console.log('✅ OpenAI API key found');

  // Initialize Supabase
  const supabase = getSupabase();
  if (!supabase) {
    console.error('❌ Failed to initialize Supabase client. Check your .env file.');
    process.exit(1);
  }
  console.log('✅ Supabase client initialized');

  // Get cities from CA_CITIES (filtered if flag provided)
  let cities = [...CA_CITIES];
  if (CITY_FILTER) {
    cities = cities.filter(c => c === CITY_FILTER);
    if (cities.length === 0) {
      console.error(`❌ City "${CITY_FILTER}" not found in CA_CITIES`);
      process.exit(1);
    }
  }
  
  // Get page types (filtered if flag provided)
  let pageTypes = PAGE_TYPE_SLUGS;
  if (TYPE_FILTER) {
    pageTypes = pageTypes.filter(t => t === TYPE_FILTER);
    if (pageTypes.length === 0) {
      console.error(`❌ Page type "${TYPE_FILTER}" not found`);
      process.exit(1);
    }
  }
  
  const totalPages = cities.length * pageTypes.length;

  console.log('');
  console.log('📊 Configuration:');
  console.log(`   Cities: ${cities.length} (${cities.join(', ')})`);
  console.log(`   Page Types: ${pageTypes.length}`);
  console.log(`   Total Landing Pages: ${totalPages}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Counters
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let currentPage = 0;

  // Process each city
  for (const citySlug of cities) {
    const cityName = slugToDisplayName(citySlug);
    console.log(`\n🏙️  Processing: ${cityName}`);
    console.log('   ─────────────────────────────────────');

    // Process each page type for this city
    for (const pageType of pageTypes) {
      currentPage++;
      const progress = `[${currentPage}/${totalPages}]`;
      const pageTypeConfig = PAGE_TYPE_BY_SLUG[pageType];

      // Check if page already exists (skip check if force regenerate)
      if (!FORCE_REGENERATE) {
        const exists = await pageExists(supabase, cityName, pageType);
        if (exists) {
          console.log(`   ${progress} ⏭️  ${pageType} - Skipped (exists)`);
          skippedCount++;
          continue;
        }
      }

      // Generate AI content
      console.log(`   ${progress} 🔄 ${pageType} - Generating AI content${USE_V4 ? ' (v4)' : ''}...`);
      const { content, v4Meta } = await generatePageContent(cityName, citySlug, pageType, pageTypeConfig);

      if (!content) {
        console.log(`   ${progress} ❌ ${pageType} - Failed to generate`);
        errorCount++;
        continue;
      }

      // Log v4 metadata if available
      if (v4Meta) {
        if (v4Meta.semantic_repairs > 0) {
          console.log(`        ⚡ V4: ${v4Meta.attempts} attempts, ${v4Meta.semantic_repairs} repairs`);
        }
      }

      // Save to database
      const saved = await saveLandingPage(supabase, cityName, citySlug, pageType, content);
      if (saved) {
        console.log(`   ${progress} ✅ ${pageType} - Created & saved`);
        console.log(`        Title: "${content.seo.title}"`);
        createdCount++;
      } else {
        console.log(`   ${progress} ❌ ${pageType} - Save failed`);
        errorCount++;
      }

      // Rate limiting delay between generations
      if (currentPage < totalPages) {
        await new Promise(resolve => setTimeout(resolve, GENERATION_DELAY_MS));
      }
    }
  }

  // Summary
  console.log('');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        GENERATION COMPLETE                       ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Created:  ${String(createdCount).padStart(5)} pages (with AI content)                  ║`);
  console.log(`║  ⏭️  Skipped:  ${String(skippedCount).padStart(5)} pages (already existed)                  ║`);
  console.log(`║  ❌ Errors:   ${String(errorCount).padStart(5)} pages                                     ║`);
  console.log(`║  📊 Total:    ${String(totalPages).padStart(5)} pages                                     ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  if (errorCount === 0 && createdCount === 0 && skippedCount > 0) {
    console.log('ℹ️  All pages already exist. No new pages were created.');
    console.log('   To regenerate content for existing pages, use:');
    console.log('   npx ts-node --project tsconfig.scripts.json src/scripts/regenerate-landing.ts --all');
  }

  if (createdCount > 0) {
    console.log('✅ New landing pages have been created with full AI-generated content!');
    console.log('   View them in the admin dashboard or at:');
    console.log('   http://localhost:3000/california/[city-slug]/[page-type]');
  }

  if (errorCount > 0) {
    console.log('');
    console.log('⚠️  Some pages failed to create. Check the errors above.');
    process.exit(1);
  }

  process.exit(0);
}

// ============================================================================
// RUN
// ============================================================================

main().catch((err) => {
  console.error('');
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
