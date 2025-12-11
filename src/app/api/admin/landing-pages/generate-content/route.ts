import { NextRequest, NextResponse } from "next/server";
import { generateAIDescription } from "@/lib/landing/ai";
import { LANDINGS_BY_SLUG, type LandingSlug } from "@/lib/landing/defs";
import { getSupabase } from "@/lib/supabase";
// New AI module imports for structured landing page content
import {
  generateLandingPageContentWithFallback,
  buildInputJson,
  type LandingPageContent,
  type InputJson,
  type GenerationResult,
} from "@/ai/landing";
import { PAGE_TYPE_BY_SLUG, isValidPageTypeSlug } from "@/ai/pageTypes";
import type { LandingKind } from "@/types/landing";

export const dynamic = "force-dynamic";

/**
 * Build local area data for the city
 * This can be expanded to fetch from a database in the future
 */
function getLocalAreas(city: string): Array<{name: string; notes?: string}> {
  // Default local areas - can be customized per city
  const cityLower = city.toLowerCase();
  if (cityLower === "san diego") {
    return [
      { name: "La Jolla", notes: "Coastal community known for beaches and upscale properties" },
      { name: "Pacific Beach", notes: "Beach town with active lifestyle and diverse housing" },
      { name: "North Park", notes: "Urban neighborhood with walkable streets and restaurants" },
    ];
  }
  // Generic fallback
  return [];
}

/**
 * Build internal links for the landing page
 */
function getInternalLinks(city: string, kind: string, state: string = "california") {
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
 * POST /api/admin/landing-pages/generate-content
 * Generate AI content for a landing page based on city and kind
 * 
 * Supports two modes:
 * - Legacy mode (default): Returns HTML content for backward compatibility
 * - New mode (format=json): Returns structured JSON matching the new schema with real Cloud SQL data
 * 
 * When pageId is provided, the generated content is saved to the landing_pages table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, kind, format = "legacy", state = "california", pageId } = body;

    if (!city || !kind) {
      return NextResponse.json(
        { error: "City and kind are required" },
        { status: 400 }
      );
    }

    // New JSON format using the centralized AI module with real Cloud SQL data
    if (format === "json" && isValidPageTypeSlug(kind)) {
      try {
        const pageTypeConfig = PAGE_TYPE_BY_SLUG[kind];
        const citySlug = city.toLowerCase().replace(/\s+/g, "-");
        const stateSlug = state.toLowerCase().replace(/\s+/g, "-");
        
        console.log("[generate-content] Using new AI module with Cloud SQL data", {
          city,
          kind,
          pageType: pageTypeConfig.PAGE_TYPE_SLUG,
        });

        // Build INPUT_JSON from real Cloud SQL data (not static placeholders)
        const inputJson = await buildInputJson({
          city,
          state: stateSlug === "california" ? "CA" : stateSlug.toUpperCase(),
          kind: kind as LandingKind,
          canonicalPath: `/${stateSlug}/${citySlug}/${kind}`,
          region: "Southern California",
          localAreas: getLocalAreas(city),
          internalLinks: getInternalLinks(city, kind, state),
          debug: process.env.LANDING_DEBUG === "true",
        });

        console.log("[generate-content] Built INPUT_JSON with market stats:", {
          hasMarketStats: !!inputJson.market_stats_text,
          marketStats: inputJson.market_stats_text,
          hasMissingSpecs: inputJson.featured_listings_has_missing_specs,
        });

        // Use the new hybrid model fallback system
        const result: GenerationResult = await generateLandingPageContentWithFallback(
          pageTypeConfig,
          inputJson
        );

        const content = result.content;

        console.log("[generate-content] Generation complete", {
          model_used: result.model_used,
          fallback_attempted: result.fallback_attempted,
          attempts: result.attempts,
        });

        // Save to database if pageId is provided
        let dbUpdateSuccess = false;
        let dbError: string | null = null;
        
        if (pageId) {
          const supabase = getSupabase();
          if (supabase) {
            try {
              const { error: updateError } = await supabase
                .from("landing_pages")
                .update({
                  // Store full JSON content in the 'content' column only
                  content: content,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", pageId);

              if (updateError) {
                console.error("[generate-content] Database update error:", updateError);
                dbError = updateError.message;
              } else {
                dbUpdateSuccess = true;
                console.log("[generate-content] Database updated successfully for pageId:", pageId);
              }
            } catch (err) {
              console.error("[generate-content] Database update exception:", err);
              dbError = err instanceof Error ? err.message : "Unknown database error";
            }
          } else {
            console.warn("[generate-content] Supabase not configured, skipping database update");
            dbError = "Supabase not configured";
          }
        }

        return NextResponse.json({
          success: true,
          format: "json",
          content, // Full structured content
          // Also return flat fields for convenience
          title: content.seo.title,
          meta_title: content.seo.title,
          meta_description: content.seo.meta_description,
          h1: content.seo.h1,
          canonical_path: content.seo.canonical_path,
          description: content.intro.subheadline,
          // Generation metadata (non-breaking additions)
          _metadata: {
            model_used: result.model_used,
            fallback_attempted: result.fallback_attempted,
            attempts: result.attempts,
            token_usage: result.token_usage,
            db_updated: dbUpdateSuccess,
            db_error: dbError,
          },
        });
      } catch (aiError: unknown) {
        const errorMessage = aiError instanceof Error ? aiError.message : "Unknown error";
        console.error("[generate-content] New AI generation error:", errorMessage);
        return NextResponse.json(
          { error: "Failed to generate structured content", details: errorMessage },
          { status: 500 }
        );
      }
    }

    // Legacy mode - uses the old generateAIDescription function
    let aiContent: string | undefined;
    try {
      aiContent = await generateAIDescription(city, kind as any, { 
        forceRegenerate: true 
      });
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      return NextResponse.json(
        { error: "Failed to generate AI content" },
        { status: 500 }
      );
    }

    // Get landing definition for title and description
    const landingDef = LANDINGS_BY_SLUG[kind as LandingSlug];
    
    // Generate meta information
    const cityTitle = city.replace(/\b\w/g, (c: string) => c.toUpperCase());
    const kindTitle = kind
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const title = landingDef 
      ? landingDef.title(cityTitle)
      : `${kindTitle} in ${cityTitle}, CA`;
    
    const description = landingDef
      ? landingDef.description(cityTitle)
      : `Explore ${kindTitle.toLowerCase()} in ${cityTitle}, CA with photos, prices, and local insights.`;

    // Extract first paragraph for short description
    const firstPara = aiContent
      ? aiContent.split("</p>")[0].replace(/<[^>]*>/g, "").trim()
      : description;

    return NextResponse.json({
      format: "legacy",
      content: aiContent || "",
      title,
      meta_title: title.slice(0, 60), // Limit to 60 chars
      meta_description: (firstPara || description).slice(0, 160), // Limit to 160 chars
      description: firstPara || description,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/landing-pages/generate-content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
