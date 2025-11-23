import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CA_CITIES } from "@/lib/seo/cities";
import { LANDINGS } from "@/lib/landing/defs";
import { generateAIDescription } from "@/lib/landing/ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/generate-landing-pages
 * Generate landing pages for California cities with AI content
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const pagesToCreate = [];
    let successCount = 0;
    let errorCount = 0;

    // Generate pages for each CA city and landing type
    for (const citySlug of CA_CITIES) {
      const cityName = citySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      for (const landing of LANDINGS) {
        try {
          // Check if page already exists
          const { data: existing } = await supabase
            .from("landing_pages")
            .select("id")
            .eq("city", cityName)
            .eq("page_name", landing.slug)
            .maybeSingle();

          if (existing) {
            console.log(`Page already exists: ${cityName} - ${landing.slug}`);
            continue;
          }

          // Generate AI description (this will also cache it)
          let aiDescription: string | undefined;
          try {
            aiDescription = await generateAIDescription(cityName, landing.slug as any);
          } catch (aiError) {
            console.error(`AI generation failed for ${cityName} - ${landing.slug}:`, aiError);
            aiDescription = undefined;
          }

          const pageData = {
            city: cityName,
            page_name: landing.slug,
            kind: landing.slug,
            ai_description_html: aiDescription || null,
            seo_metadata: {
              title: landing.title(cityName),
              description: landing.description(cityName),
            },
          };

          pagesToCreate.push(pageData);
        } catch (err) {
          console.error(`Error processing ${cityName} - ${landing.slug}:`, err);
          errorCount++;
        }
      }
    }

    // Insert pages in batches
    if (pagesToCreate.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < pagesToCreate.length; i += batchSize) {
        const batch = pagesToCreate.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from("landing_pages")
          .upsert(batch, { onConflict: "city,page_name" });

        if (insertError) {
          console.error("Error inserting landing pages batch:", insertError);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} landing pages`,
      successCount,
      errorCount,
      totalAttempted: pagesToCreate.length,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/generate-landing-pages:", error);
    return NextResponse.json(
      { error: "Failed to generate landing pages" },
      { status: 500 }
    );
  }
}
