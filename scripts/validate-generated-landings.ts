#!/usr/bin/env npx ts-node
/**
 * Landing Page Validation Script
 * ===============================
 * Validates existing generated landing pages against semantic rules.
 * Can optionally regenerate failing pages.
 * 
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/validate-generated-landings.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/validate-generated-landings.ts --regenerate-failing
 *   npx ts-node --project tsconfig.scripts.json scripts/validate-generated-landings.ts --city="Irvine"
 *   npx ts-node --project tsconfig.scripts.json scripts/validate-generated-landings.ts --page-type="luxury-homes"
 * 
 * Options:
 *   --regenerate-failing   Regenerate pages that fail validation
 *   --city=<name>          Only validate pages for specific city
 *   --page-type=<slug>     Only validate specific page type
 *   --verbose              Show detailed validation errors
 *   --json-report          Output results as JSON
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { CA_CITIES, cityToTitle } from '../src/lib/seo/cities';
import { getAllPageTypeSlugs, PAGE_TYPE_BY_SLUG } from '../src/ai/pageTypes';
import { 
  validateExistingContent, 
  generateLandingPageContentV4,
  enrichWithAllowlist,
} from '../src/ai/landing.v4';
import type { LandingPageContent, InputJson } from '../src/ai/landing';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Enable AI generation for regeneration
process.env.ALLOW_AI_GENERATION = 'true';

// ============================================================================
// CLI Arguments
// ============================================================================

interface CLIOptions {
  regenerateFailing: boolean;
  city?: string;
  pageType?: string;
  verbose: boolean;
  jsonReport: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  return {
    regenerateFailing: args.includes('--regenerate-failing'),
    city: args.find(a => a.startsWith('--city='))?.split('=')[1],
    pageType: args.find(a => a.startsWith('--page-type='))?.split('=')[1],
    verbose: args.includes('--verbose'),
    jsonReport: args.includes('--json-report'),
  };
}

// ============================================================================
// Supabase Client
// ============================================================================

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.error('❌ SUPABASE_URL not set');
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
// Types
// ============================================================================

interface PageRecord {
  id: string;
  city: string;
  page_name: string;
  slug: string;
  content: LandingPageContent | null;
  updated_at: string;
}

interface ValidationReport {
  timestamp: string;
  totalPages: number;
  passed: number;
  failed: number;
  regenerated: number;
  regenerationFailed: number;
  details: Array<{
    city: string;
    pageType: string;
    status: 'passed' | 'failed' | 'regenerated' | 'regeneration-failed';
    errors?: Array<{ code: string; message: string }>;
  }>;
}

// ============================================================================
// Validation Logic
// ============================================================================

/**
 * Build InputJson from stored page for validation
 */
function buildInputJsonFromPage(page: PageRecord): InputJson {
  const content = page.content;
  const state = 'california'; // Default for CA_CITIES
  const citySlug = page.city.toLowerCase().replace(/\s+/g, '-');

  // Build internal links from stored content if available
  const internalLinks = content?.internal_linking ? {
    related_pages: content.internal_linking.related_pages || [],
    more_in_city: content.internal_linking.more_in_city || [],
    nearby_cities: content.internal_linking.nearby_cities || [],
  } : {
    related_pages: [],
    more_in_city: [],
    nearby_cities: [],
  };

  return {
    city: page.city,
    canonical_path: `/${state}/${citySlug}/${page.page_name}`,
    data_source: 'Cloud SQL (MLS-synced)',
    last_updated_iso: page.updated_at || new Date().toISOString(),
    featured_listings_has_missing_specs: true,
    region: 'California',
    internal_links: internalLinks,
  };
}

/**
 * Validate a single page
 */
function validatePage(
  page: PageRecord,
  verbose: boolean
): { passed: boolean; errors: Array<{ code: string; message: string }> } {
  if (!page.content) {
    return {
      passed: false,
      errors: [{ code: 'NO_CONTENT', message: 'Page has no content' }],
    };
  }

  const inputJson = buildInputJsonFromPage(page);
  const enrichedInput = enrichWithAllowlist(inputJson);
  const result = validateExistingContent(page.content, enrichedInput);

  if (verbose && !result.ok) {
    console.log(`\n  Errors for ${page.city} / ${page.page_name}:`);
    result.errors.forEach(e => {
      console.log(`    - [${e.code}] ${e.message}`);
    });
  }

  return {
    passed: result.ok,
    errors: result.errors.map(e => ({ code: e.code, message: e.message })),
  };
}

/**
 * Regenerate a failing page
 */
async function regeneratePage(
  supabase: SupabaseClient,
  page: PageRecord
): Promise<boolean> {
  const pageTypeConfig = PAGE_TYPE_BY_SLUG[page.page_name];
  if (!pageTypeConfig) {
    console.error(`    Unknown page type: ${page.page_name}`);
    return false;
  }

  try {
    const inputJson = buildInputJsonFromPage(page);
    const enrichedInput = enrichWithAllowlist(inputJson);

    const result = await generateLandingPageContentV4(pageTypeConfig, enrichedInput);

    // Save regenerated content
    const { error } = await supabase
      .from('landing_pages')
      .update({
        content: result.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id);

    if (error) {
      console.error(`    Save error: ${error.message}`);
      return false;
    }

    console.log(`    ✅ Regenerated (${result.attempts} attempts, ${result.semantic_repairs} repairs)`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`    ❌ Regeneration failed: ${msg}`);
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const options = parseArgs();

  if (!options.jsonReport) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║          LANDING PAGE VALIDATION SCRIPT (v4)                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  const supabase = getSupabase();
  if (!supabase) {
    process.exit(1);
  }

  // Build query
  let query = supabase
    .from('landing_pages')
    .select('id, city, page_name, slug, content, updated_at');

  if (options.city) {
    query = query.ilike('city', `%${options.city}%`);
  }

  if (options.pageType) {
    query = query.eq('page_name', options.pageType);
  }

  const { data: pages, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch pages:', error.message);
    process.exit(1);
  }

  if (!pages || pages.length === 0) {
    console.log('No pages found matching criteria.');
    process.exit(0);
  }

  if (!options.jsonReport) {
    console.log(`📊 Found ${pages.length} pages to validate`);
    if (options.regenerateFailing) {
      console.log('   (Will regenerate failing pages)');
    }
    console.log('');
  }

  // Validation report
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalPages: pages.length,
    passed: 0,
    failed: 0,
    regenerated: 0,
    regenerationFailed: 0,
    details: [],
  };

  // Process each page
  for (const page of pages as PageRecord[]) {
    if (!options.jsonReport) {
      process.stdout.write(`  ${page.city} / ${page.page_name}: `);
    }

    const { passed, errors } = validatePage(page, options.verbose);

    if (passed) {
      report.passed++;
      report.details.push({
        city: page.city,
        pageType: page.page_name,
        status: 'passed',
      });
      if (!options.jsonReport) {
        console.log('✅ PASSED');
      }
    } else {
      // Failed validation
      if (!options.jsonReport) {
        console.log(`❌ FAILED (${errors.length} errors)`);
      }

      if (options.regenerateFailing) {
        if (!options.jsonReport) {
          console.log('    Regenerating...');
        }

        const regenerated = await regeneratePage(supabase, page);
        
        if (regenerated) {
          report.regenerated++;
          report.details.push({
            city: page.city,
            pageType: page.page_name,
            status: 'regenerated',
            errors,
          });
        } else {
          report.regenerationFailed++;
          report.details.push({
            city: page.city,
            pageType: page.page_name,
            status: 'regeneration-failed',
            errors,
          });
        }

        // Rate limit between regenerations
        await new Promise(r => setTimeout(r, 2000));
      } else {
        report.failed++;
        report.details.push({
          city: page.city,
          pageType: page.page_name,
          status: 'failed',
          errors,
        });
      }
    }
  }

  // Output report
  if (options.jsonReport) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                      VALIDATION SUMMARY                          ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║  Total Pages:        ${String(report.totalPages).padStart(5)}                                   ║`);
    console.log(`║  ✅ Passed:          ${String(report.passed).padStart(5)}                                   ║`);
    console.log(`║  ❌ Failed:          ${String(report.failed).padStart(5)}                                   ║`);
    if (options.regenerateFailing) {
      console.log(`║  🔄 Regenerated:     ${String(report.regenerated).padStart(5)}                                   ║`);
      console.log(`║  💥 Regen Failed:    ${String(report.regenerationFailed).padStart(5)}                                   ║`);
    }
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');

    // Show failing pages summary
    const failedPages = report.details.filter(d => d.status === 'failed');
    if (failedPages.length > 0) {
      console.log('Failed pages:');
      failedPages.slice(0, 10).forEach(p => {
        const errorCodes = p.errors?.map(e => e.code).join(', ') || 'unknown';
        console.log(`  - ${p.city} / ${p.pageType}: ${errorCodes}`);
      });
      if (failedPages.length > 10) {
        console.log(`  ... and ${failedPages.length - 10} more`);
      }
      console.log('');
      console.log('To regenerate failing pages, run with --regenerate-failing');
    }
  }

  // Exit with error if there are failures
  const hasFailures = report.failed > 0 || report.regenerationFailed > 0;
  process.exit(hasFailures ? 1 : 0);
}

// Run
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
