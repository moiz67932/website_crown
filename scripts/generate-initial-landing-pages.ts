#!/usr/bin/env npx ts-node
/**
 * ONE-TIME Bootstrap Script: Generate Initial Landing Pages
 * 
 * This script generates landing pages for all CA_CITIES × LANDINGS combinations.
 * It checks for existing pages and SKIPS them to prevent duplicates.
 * 
 * Usage:
 *   npx ts-node scripts/generate-initial-landing-pages.ts
 *   
 * Or with tsx:
 *   npx tsx scripts/generate-initial-landing-pages.ts
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { CA_CITIES } from '../src/lib/seo/cities';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================================
// LANDING PAGE DEFINITIONS (from src/lib/landing/defs.ts)
// ============================================================================
type LandingSlug =
  | 'homes-for-sale'
  | 'condos-for-sale'
  | 'homes-with-pool'
  | 'luxury-homes'
  | 'homes-under-500k'
  | 'homes-over-1m'
  | '2-bedroom-apartments';

interface LandingDef {
  slug: LandingSlug;
  title: (city: string) => string;
  description: (city: string) => string;
}

const up = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

const LANDINGS: LandingDef[] = [
  {
    slug: 'homes-for-sale',
    title: (city) => `${up(city)}, CA Homes For Sale`,
    description: (city) => `Explore homes for sale in ${up(city)}, CA with photos, prices, and local insights.`,
  },
  {
    slug: 'condos-for-sale',
    title: (city) => `${up(city)}, CA Condos For Sale`,
    description: (city) => `Browse condos for sale in ${up(city)}, CA — modern amenities, great locations, updated daily.`,
  },
  {
    slug: 'homes-with-pool',
    title: (city) => `${up(city)}, CA Homes With Pool`,
    description: (city) => `See homes with pools in ${up(city)}, CA — perfect for warm days and outdoor living.`,
  },
  {
    slug: 'luxury-homes',
    title: (city) => `${up(city)}, CA Luxury Homes`,
    description: (city) => `Discover luxury homes in ${up(city)}, CA — high-end finishes and premier locations.`,
  },
  {
    slug: 'homes-under-500k',
    title: (city) => `${up(city)}, CA Homes Under $500k`,
    description: (city) => `Affordable homes under $500k in ${up(city)}, CA — start your search here.`,
  },
  {
    slug: 'homes-over-1m',
    title: (city) => `${up(city)}, CA Homes Over $1M`,
    description: (city) => `Explore homes over $1M in ${up(city)}, CA — premium properties and locations.`,
  },
  {
    slug: '2-bedroom-apartments',
    title: (city) => `2-Bedroom Apartments in ${up(city)}, CA`,
    description: (city) => `Find 2-bedroom apartments in ${up(city)}, CA — space, convenience, and great locations.`,
  },
];

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
function slugToCity(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Convert readonly array to regular array
function getUniqueCities(): string[] {
  return [...CA_CITIES];
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================
async function generateLandingPages() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         LANDING PAGES BOOTSTRAP SCRIPT (ONE-TIME)                ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  const supabase = getSupabase();
  if (!supabase) {
    console.error('❌ Failed to initialize Supabase client. Check your .env file.');
    process.exit(1);
  }

  console.log('✅ Supabase client initialized');
  
  const cities = getUniqueCities();
  const totalExpected = cities.length * LANDINGS.length;
  
  console.log(`📊 Cities: ${cities.length}`);
  console.log(`📊 Landing types: ${LANDINGS.length}`);
  console.log(`📊 Expected pages: ${totalExpected}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const pagesToCreate: any[] = [];

  // First pass: Check all pages and collect new ones
  for (const citySlug of cities) {
    const cityName = slugToCity(citySlug);

    for (const landing of LANDINGS) {
      try {
        // Check if page already exists (by city + page_name)
        const { data: existing, error: checkError } = await supabase
          .from('landing_pages')
          .select('id')
          .eq('city', cityName)
          .eq('page_name', landing.slug)
          .maybeSingle();

        if (checkError) {
          console.error(`❌ Error checking: ${citySlug} / ${landing.slug} - ${checkError.message}`);
          errorCount++;
          continue;
        }

        if (existing) {
          console.log(`⏭️  Skipped (exists): ${citySlug} / ${landing.slug}`);
          skippedCount++;
          continue;
        }

        // Page doesn't exist, add to creation queue
        const pageData = {
          city: cityName,
          page_name: landing.slug,
          kind: landing.slug,
          content: {
            seo: {
              title: landing.title(cityName),
              meta_description: landing.description(cityName),
            },
          },
        };

        pagesToCreate.push({ citySlug, landing, pageData });
      } catch (err) {
        console.error(`❌ Error processing: ${citySlug} / ${landing.slug}`, err);
        errorCount++;
      }
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📋 Pages to create: ${pagesToCreate.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Second pass: Insert pages in batches
  if (pagesToCreate.length > 0) {
    const batchSize = 50;
    const totalBatches = Math.ceil(pagesToCreate.length / batchSize);
    
    for (let i = 0; i < pagesToCreate.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1;
      const batch = pagesToCreate.slice(i, i + batchSize);
      const batchData = batch.map(b => b.pageData);

      console.log(`📦 Inserting batch ${batchNum}/${totalBatches} (${batch.length} pages)...`);

      const { error: insertError } = await supabase
        .from('landing_pages')
        .upsert(batchData, { onConflict: 'city,page_name' });

      if (insertError) {
        console.error(`❌ Batch ${batchNum} failed: ${insertError.message}`);
        errorCount += batch.length;
      } else {
        // Log each created page
        for (const item of batch) {
          console.log(`✅ Created: ${item.citySlug} / ${item.landing.slug}`);
          createdCount++;
        }
      }
    }
  }

  // Summary
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        GENERATION COMPLETE                       ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Created:  ${String(createdCount).padStart(5)} pages                                     ║`);
  console.log(`║  ⏭️  Skipped:  ${String(skippedCount).padStart(5)} pages (already existed)                  ║`);
  console.log(`║  ❌ Errors:   ${String(errorCount).padStart(5)} pages                                     ║`);
  console.log(`║  📊 Total:    ${String(createdCount + skippedCount + errorCount).padStart(5)} pages                                     ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  if (errorCount === 0 && createdCount === 0 && skippedCount > 0) {
    console.log('ℹ️  All pages already exist. No new pages were created.');
  }

  if (errorCount > 0) {
    console.log('⚠️  Some pages failed to create. Check the errors above.');
    process.exit(1);
  }

  process.exit(0);
}

// ============================================================================
// RUN
// ============================================================================
generateLandingPages().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
