/**
 * Regenerate Landing Page Content Script (TypeScript version)
 * ===========================================================
 * 
 * This script regenerates AI content for landing pages using the new
 * centralized prompt module (src/ai/landing.ts) with real Cloud SQL data.
 * 
 * Usage:
 *   npx ts-node src/scripts/regenerate-landing.ts [city] [page-type]
 *   npx ts-node src/scripts/regenerate-landing.ts "san diego" "homes-for-sale"
 *   npx ts-node src/scripts/regenerate-landing.ts --all  (regenerate all pages)
 *   npx ts-node src/scripts/regenerate-landing.ts --list (list all pages)
 * 
 * Environment Variables Required:
 *   - OPENAI_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_URL (for Cloud SQL stats)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import {
  generateLandingPageContent,
  buildInputJson,
  type InputJson,
  type LandingPageContent,
} from "../ai/landing";
import { PAGE_TYPE_BY_SLUG, isValidPageTypeSlug, type PageTypeConfig } from "../ai/pageTypes";
import type { LandingKind } from "../types/landing";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Get local areas for a city (can be expanded to fetch from DB)
 */
function getLocalAreas(city: string): Array<{name: string; notes?: string}> {
  const cityLower = city.toLowerCase();
  if (cityLower === "san diego") {
    return [
      { name: "La Jolla", notes: "Coastal community known for beaches and upscale properties" },
      { name: "Pacific Beach", notes: "Beach town with active lifestyle and diverse housing" },
      { name: "North Park", notes: "Urban neighborhood with walkable streets and restaurants" },
    ];
  }
  return [];
}

/**
 * Get internal links for a landing page
 */
function getInternalLinks(city: string, pageType: string, state: string = "california") {
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");
  const stateSlug = state.toLowerCase().replace(/\s+/g, "-");
  
  return {
    related_pages: [
      { href: `/${stateSlug}/${citySlug}/condos-for-sale`, anchor: `${city} Condos for Sale` },
      { href: `/${stateSlug}/${citySlug}/homes-for-sale`, anchor: `${city} Homes for Sale` },
    ],
    more_in_city: [
      { href: `/${stateSlug}/${citySlug}/luxury-homes`, anchor: `${city} Luxury Homes` },
    ],
    nearby_cities: [
      { href: `/${stateSlug}/la-jolla/homes-for-sale`, anchor: "La Jolla" },
      { href: `/${stateSlug}/coronado/homes-for-sale`, anchor: "Coronado" },
    ],
  };
}

/**
 * Regenerate content for a specific city and page type using real Cloud SQL data
 */
async function regenerateLandingContent(city: string, pageType: string): Promise<void> {
  const lowercaseCity = city.toLowerCase();
  const citySlug = lowercaseCity.replace(/\s+/g, "-");

  console.log(`\n🔄 Regenerating content for: ${city} - ${pageType}`);

  // Validate page type
  if (!isValidPageTypeSlug(pageType)) {
    console.error(`❌ Invalid page type: ${pageType}`);
    console.error("   Valid page types:", Object.keys(PAGE_TYPE_BY_SLUG).join(", "));
    return;
  }

  const pageTypeConfig: PageTypeConfig = PAGE_TYPE_BY_SLUG[pageType];

  try {
    // Build input JSON from real Cloud SQL data
    console.log("📊 Fetching real market stats from Cloud SQL...");
    const inputJson = await buildInputJson({
      city,
      state: "CA",
      kind: pageType as LandingKind,
      canonicalPath: `/california/${citySlug}/${pageType}`,
      region: "Southern California",
      localAreas: getLocalAreas(city),
      internalLinks: getInternalLinks(city, pageType),
      debug: true, // Enable debug logging in CLI
    });

    console.log("📝 Generating content with new AI prompt...");
    console.log("   Page Type:", pageTypeConfig.PAGE_TYPE_SLUG);
    console.log("   Primary Intent:", pageTypeConfig.PRIMARY_INTENT);
    console.log("   Market Stats:", inputJson.market_stats_text);
    console.log("   Data Source:", inputJson.data_source);

    // Generate content using the new module
    const content: LandingPageContent = await generateLandingPageContent(pageTypeConfig, inputJson);

    console.log("✅ Content generated successfully!");
    console.log("   Title:", content.seo.title);
    console.log("   H1:", content.seo.h1);
    console.log("   FAQs:", content.faq.length);
    console.log("   Neighborhoods:", content.sections.neighborhoods.cards.length);

    // Save to database - store only the full JSON content
    const { error: updateError } = await supabase
      .from("landing_pages")
      .upsert(
        {
          city: lowercaseCity,
          page_name: pageType,
          content: content, // Store the full JSON content in 'content' column only
          updated_at: new Date().toISOString(),
        },
        { onConflict: "city,page_name" }
      );

    if (updateError) {
      console.error("❌ Error saving to database:", updateError.message);
      return;
    }

    console.log("✅ Successfully saved to database");
    console.log(`   Visit: http://localhost:3000/california/${lowercaseCity.replace(/\s+/g, "-")}/${pageType}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error generating content:", errorMessage);
  }
}

/**
 * List all landing pages in the database
 */
async function listLandingPages(): Promise<void> {
  console.log("\n📋 Fetching all landing pages...");

  try {
    const { data, error } = await supabase
      .from("landing_pages")
      .select("city, page_name, updated_at")
      .order("city", { ascending: true })
      .order("page_name", { ascending: true });

    if (error) {
      console.error("❌ Error fetching landing pages:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log("⚠️  No landing pages found");
      return;
    }

    console.log(`\n✅ Found ${data.length} landing pages:\n`);
    data.forEach((page, i) => {
      console.log(`${i + 1}. City: "${page.city}", Page: "${page.page_name}" (updated: ${page.updated_at})`);
    });

    console.log("\n📖 Usage:");
    console.log('   npx ts-node src/scripts/regenerate-landing.ts "<city>" "<page-type>"');
    console.log('   npx ts-node src/scripts/regenerate-landing.ts "san diego" "homes-for-sale"');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Unexpected error:", errorMessage);
  }
}

/**
 * Regenerate all landing pages
 */
async function regenerateAllPages(): Promise<void> {
  console.log("\n🔄 Regenerating ALL landing pages...");

  try {
    const { data, error } = await supabase
      .from("landing_pages")
      .select("city, page_name")
      .order("city", { ascending: true });

    if (error) {
      console.error("❌ Error fetching landing pages:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log("⚠️  No landing pages found to regenerate");
      return;
    }

    console.log(`📝 Found ${data.length} pages to regenerate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const page of data) {
      try {
        await regenerateLandingContent(page.city, page.page_name);
        successCount++;
        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed: ${page.city} - ${page.page_name}`);
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Unexpected error:", errorMessage);
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--list") {
    await listLandingPages();
  } else if (args[0] === "--all") {
    await regenerateAllPages();
  } else if (args.length === 2) {
    const [city, pageType] = args;
    await regenerateLandingContent(city, pageType);
  } else {
    console.error("❌ Invalid arguments");
    console.error("Usage:");
    console.error('  npx ts-node src/scripts/regenerate-landing.ts "<city>" "<page-type>"');
    console.error('  npx ts-node src/scripts/regenerate-landing.ts "san diego" "homes-for-sale"');
    console.error("  npx ts-node src/scripts/regenerate-landing.ts --list");
    console.error("  npx ts-node src/scripts/regenerate-landing.ts --all");
    process.exit(1);
  }
}

main().catch(console.error);
