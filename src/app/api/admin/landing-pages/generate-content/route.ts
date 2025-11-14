import { NextRequest, NextResponse } from "next/server";
import { getAIDescription } from "@/lib/landing/ai";
import { LANDINGS_BY_SLUG, type LandingSlug } from "@/lib/landing/defs";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/landing-pages/generate-content
 * Generate AI content for a landing page based on city and kind
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, kind } = body;

    if (!city || !kind) {
      return NextResponse.json(
        { error: "City and kind are required" },
        { status: 400 }
      );
    }

    // Generate AI content
    let aiContent: string | undefined;
    try {
      aiContent = await getAIDescription(city, kind as any, { 
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
