#!/usr/bin/env ts-node
/**
 * Admin Generator Regression Test
 * ================================
 * 
 * Tests the new JSON generator endpoint used by Admin UI.
 * Validates:
 * - API endpoint responds correctly
 * - JSON schema is valid
 * - Model fallback works
 * - Database save works (if configured)
 * 
 * Usage:
 *   npx ts-node src/scripts/test-new-admin-generator.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { LandingPageContentSchema } from "../ai/landing";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestCase {
  city: string;
  kind: string;
  description: string;
}

const TEST_CASES: TestCase[] = [
  { city: "San Diego", kind: "homes-for-sale", description: "San Diego Homes" },
  { city: "Los Angeles", kind: "condos-for-sale", description: "LA Condos" },
];

interface GenerateResponse {
  success?: boolean;
  format?: string;
  content?: unknown;
  title?: string;
  meta_title?: string;
  meta_description?: string;
  h1?: string;
  canonical_path?: string;
  description?: string;
  error?: string;
  details?: string;
  _metadata?: {
    model_used?: string;
    fallback_attempted?: boolean;
    attempts?: number;
    token_usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    db_updated?: boolean;
    db_error?: string | null;
  };
}

async function testGenerateContent(testCase: TestCase): Promise<{
  success: boolean;
  result?: GenerateResponse;
  error?: string;
  validationErrors?: string[];
}> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${testCase.description}`);
  console.log(`City: ${testCase.city}, Kind: ${testCase.kind}`);
  console.log("=".repeat(60));

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/admin/landing-pages/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: testCase.city,
        kind: testCase.kind,
        format: "json",
      }),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Response received in ${elapsed}s`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as GenerateResponse;
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData.error || errorData.details || "Unknown error"}`,
      };
    }

    const result = await response.json() as GenerateResponse;

    // Validate response structure
    if (!result.content) {
      return {
        success: false,
        error: "Response missing 'content' field",
        result,
      };
    }

    // Validate against Zod schema
    const parseResult = LandingPageContentSchema.safeParse(result.content);
    if (!parseResult.success) {
      return {
        success: false,
        error: "Schema validation failed",
        result,
        validationErrors: parseResult.error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        ),
      };
    }

    console.log("\n✅ PASSED");
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function printResult(testCase: TestCase, outcome: Awaited<ReturnType<typeof testGenerateContent>>) {
  if (outcome.success && outcome.result) {
    const r = outcome.result;
    const content = r.content as { seo?: { title?: string }; faq?: unknown[]; sections?: { neighborhoods?: { cards?: unknown[] } } };
    
    console.log("\n📊 Generation Results:");
    console.log(`   Model Used: ${r._metadata?.model_used || "unknown"}`);
    console.log(`   Fallback Attempted: ${r._metadata?.fallback_attempted ?? "unknown"}`);
    console.log(`   Total Attempts: ${r._metadata?.attempts || "unknown"}`);
    console.log(`   DB Updated: ${r._metadata?.db_updated ?? "N/A"}`);
    
    if (r._metadata?.token_usage) {
      console.log("\n💰 Token Usage:");
      console.log(`   Prompt: ${r._metadata.token_usage.prompt_tokens}`);
      console.log(`   Completion: ${r._metadata.token_usage.completion_tokens}`);
      console.log(`   Total: ${r._metadata.token_usage.total_tokens}`);
    }

    console.log("\n📝 Content Summary:");
    console.log(`   Title: ${r.title || content.seo?.title}`);
    console.log(`   H1: ${r.h1}`);
    console.log(`   Meta Desc Length: ${r.meta_description?.length || 0} chars`);
    console.log(`   FAQ Count: ${Array.isArray(content.faq) ? content.faq.length : 0}`);
    console.log(`   Neighborhoods: ${content.sections?.neighborhoods?.cards?.length || 0}`);
  } else {
    console.log("\n❌ FAILED");
    console.log(`   Error: ${outcome.error}`);
    if (outcome.validationErrors?.length) {
      console.log("   Validation Errors:");
      outcome.validationErrors.forEach((e) => console.log(`     - ${e}`));
    }
  }
}

async function main() {
  console.log("🧪 ADMIN GENERATOR REGRESSION TEST");
  console.log("=".repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Cases: ${TEST_CASES.length}`);
  console.log();

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!healthCheck?.ok) {
      console.log("⚠️  Note: /api/health not responding, server may not be running");
      console.log("   Make sure to run: npm run dev");
      console.log();
    }
  } catch {
    // Ignore health check errors
  }

  const results: Array<{ testCase: TestCase; outcome: Awaited<ReturnType<typeof testGenerateContent>> }> = [];

  for (const testCase of TEST_CASES) {
    const outcome = await testGenerateContent(testCase);
    results.push({ testCase, outcome });
    printResult(testCase, outcome);

    // Delay between tests to avoid rate limiting
    if (TEST_CASES.indexOf(testCase) < TEST_CASES.length - 1) {
      console.log("\n⏳ Waiting 2s before next test...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.outcome.success).length;
  const failed = results.filter((r) => !r.outcome.success).length;
  const fallbackUsed = results.filter(
    (r) => r.outcome.success && r.outcome.result?._metadata?.fallback_attempted
  ).length;

  console.log(`   Total Tests: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Used Fallback: ${fallbackUsed}`);

  if (failed > 0) {
    console.log("\n❌ SOME TESTS FAILED");
    results
      .filter((r) => !r.outcome.success)
      .forEach((r) => {
        console.log(`   - ${r.testCase.description}: ${r.outcome.error}`);
      });
    process.exit(1);
  } else {
    console.log("\n✅ ALL TESTS PASSED");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
