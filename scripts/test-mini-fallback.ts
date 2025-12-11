#!/usr/bin/env ts-node
/**
 * Smoke Test for Hybrid Model Fallback System
 * ============================================
 * 
 * This script tests the GPT-5-mini → GPT-4o-mini fallback flow.
 * 
 * Usage:
 *   npx ts-node scripts/test-mini-fallback.ts
 * 
 * Environment variables:
 *   OPENAI_API_KEY - Required
 *   OPENAI_MODEL - Optional (defaults to gpt-5-mini)
 *   LANDING_DEBUG - Set to "true" for verbose logging
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import {
  generateLandingPageContentWithFallback,
  buildInputJson,
  type GenerationResult,
} from "../src/ai/landing";
import { PAGE_TYPE_BY_SLUG } from "../src/ai/pageTypes";

async function main() {
  console.log("=".repeat(70));
  console.log("🧪 HYBRID MODEL FALLBACK SMOKE TEST");
  console.log("=".repeat(70));
  console.log();

  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set. Please set it in .env or .env.local");
    process.exit(1);
  }

  const currentModel = process.env.OPENAI_MODEL || "gpt-5-mini";
  console.log("📋 Configuration:");
  console.log(`   Primary Model: ${currentModel}`);
  console.log(`   Fallback Model: gpt-4o-mini`);
  console.log(`   Debug Mode: ${process.env.LANDING_DEBUG === "true" ? "ON" : "OFF"}`);
  console.log();

  // Test configuration
  const testCity = "San Diego";
  const testKind = "homes-for-sale";
  const pageTypeConfig = PAGE_TYPE_BY_SLUG[testKind];

  if (!pageTypeConfig) {
    console.error(`❌ Invalid page type: ${testKind}`);
    process.exit(1);
  }

  console.log("🏙️  Test Parameters:");
  console.log(`   City: ${testCity}`);
  console.log(`   Kind: ${testKind}`);
  console.log(`   Page Type: ${pageTypeConfig.PAGE_TYPE_SLUG}`);
  console.log();

  console.log("📦 Building INPUT_JSON from Cloud SQL...");
  
  let inputJson;
  try {
    inputJson = await buildInputJson({
      city: testCity,
      state: "CA",
      kind: testKind as any,
      canonicalPath: `/california/san-diego/${testKind}`,
      region: "Southern California",
      localAreas: [
        { name: "La Jolla", notes: "Coastal community known for beaches and upscale properties" },
        { name: "Pacific Beach", notes: "Beach town with active lifestyle and diverse housing" },
        { name: "North Park", notes: "Urban neighborhood with walkable streets and restaurants" },
      ],
      internalLinks: {
        related_pages: [
          { href: "/california/san-diego/condos-for-sale", anchor: "San Diego Condos for Sale" },
        ],
        more_in_city: [
          { href: "/california/san-diego/luxury-homes", anchor: "San Diego Luxury Homes" },
        ],
        nearby_cities: [
          { href: "/california/la-jolla/homes-for-sale", anchor: "La Jolla" },
        ],
      },
      debug: process.env.LANDING_DEBUG === "true",
    });
    console.log("   ✅ INPUT_JSON built successfully");
    console.log(`   Market Stats: ${inputJson.market_stats_text || "N/A"}`);
  } catch (err) {
    console.warn(`   ⚠️ Could not build INPUT_JSON from Cloud SQL: ${(err as Error).message}`);
    console.log("   Using minimal INPUT_JSON for testing...");
    
    inputJson = {
      city: testCity,
      canonical_path: `/california/san-diego/${testKind}`,
      data_source: "Test Data",
      last_updated_iso: new Date().toISOString(),
      market_stats_text: "Median price $850,000, price per sqft $550, average DOM 25 days, active listings 1,200.",
      featured_listings_has_missing_specs: true,
      local_areas: [
        { name: "La Jolla", notes: "Coastal community known for beaches and upscale properties" },
        { name: "Pacific Beach", notes: "Beach town with active lifestyle and diverse housing" },
      ],
      internal_links: {
        related_pages: [
          { href: "/california/san-diego/condos-for-sale", anchor: "San Diego Condos for Sale" },
        ],
        more_in_city: [],
        nearby_cities: [],
      },
    };
  }

  console.log();
  console.log("🤖 Starting AI Generation with Hybrid Fallback...");
  console.log("-".repeat(70));

  const startTime = Date.now();
  let result: GenerationResult;

  try {
    result = await generateLandingPageContentWithFallback(pageTypeConfig, inputJson);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error();
    console.error("❌ GENERATION FAILED");
    console.error("-".repeat(70));
    console.error(`   Error: ${(error as Error).message}`);
    console.error(`   Duration: ${elapsed}s`);
    console.error();
    console.error("   Possible causes:");
    console.error("   - OpenAI API key is invalid or expired");
    console.error("   - Model is not available (gpt-5-mini may not exist yet)");
    console.error("   - Network issues");
    console.error("   - Rate limiting");
    console.error();
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log();
  console.log("=".repeat(70));
  console.log("✅ GENERATION SUCCESSFUL");
  console.log("=".repeat(70));
  console.log();

  // Print results
  console.log("📊 Generation Results:");
  console.log(`   Model Used: ${result.model_used}`);
  console.log(`   Fallback Attempted: ${result.fallback_attempted}`);
  console.log(`   Total Attempts: ${result.attempts}`);
  console.log(`   Duration: ${elapsed}s`);
  
  if (result.token_usage) {
    console.log();
    console.log("💰 Token Usage:");
    console.log(`   Prompt Tokens: ${result.token_usage.prompt_tokens.toLocaleString()}`);
    console.log(`   Completion Tokens: ${result.token_usage.completion_tokens.toLocaleString()}`);
    console.log(`   Total Tokens: ${result.token_usage.total_tokens.toLocaleString()}`);
  }

  console.log();
  console.log("📝 Content Summary:");
  console.log(`   Title: ${result.content.seo.title}`);
  console.log(`   H1: ${result.content.seo.h1}`);
  console.log(`   Meta Description Length: ${result.content.seo.meta_description.length} chars`);
  console.log(`   FAQ Count: ${result.content.faq.length}`);
  console.log(`   Neighborhoods: ${result.content.sections.neighborhoods.cards.length}`);
  console.log(`   In-Body Links: ${result.content.internal_linking.in_body_links.length}`);

  console.log();
  console.log("📄 SEO Content Preview:");
  console.log(`   "${result.content.seo.meta_description.slice(0, 100)}..."`);

  console.log();
  console.log("=".repeat(70));
  
  // Final status
  if (result.fallback_attempted) {
    console.log("⚠️  NOTE: Fallback was used. Primary model may have issues.");
    console.log(`   Primary attempted: ${process.env.OPENAI_MODEL || "gpt-5-mini"}`);
    console.log(`   Fallback used: ${result.model_used}`);
  } else {
    console.log(`✅ Primary model (${result.model_used}) succeeded without fallback.`);
  }
  
  console.log("=".repeat(70));
  console.log();
}

// Run the test
main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
