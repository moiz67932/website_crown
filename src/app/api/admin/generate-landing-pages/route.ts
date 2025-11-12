import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/generate-landing-pages
 * Generate landing pages for all cities
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Get unique cities from properties
    const { data: cities, error: citiesError } = await supabase
      .from("properties")
      .select("city, state")
      .not("city", "is", null)
      .order("city");

    if (citiesError) {
      console.error("Error fetching cities:", citiesError);
      return NextResponse.json({ error: citiesError.message }, { status: 500 });
    }

    // Remove duplicates
    const uniqueCities = Array.from(
      new Set(cities?.map((c: { city: string; state: string }) => `${c.city}, ${c.state}`))
    );

    const pageTypes = [
      "homes-for-sale",
      "condos-for-sale",
      "luxury-homes",
      "homes-with-pool",
      "homes-under-500k",
      "homes-over-1m",
    ];

    const pagesToCreate = [];

    for (const cityState of uniqueCities) {
      const cityStateStr = cityState as string;
      const [city, state] = cityStateStr.split(", ");
      
      for (const pageType of pageTypes) {
        const slug = `/${city.toLowerCase().replace(/\s+/g, "-")}/${pageType}`;
        const title = `${pageType.replace(/-/g, " ")} in ${city}, ${state}`;
        
        pagesToCreate.push({
          city,
          state,
          slug,
          page_type: pageType,
          title,
          description: `Find the best ${pageType.replace(/-/g, " ")} in ${city}, ${state}. Browse our comprehensive listings.`,
          status: "published",
        });
      }
    }

    // Insert pages in batches
    const batchSize = 100;
    for (let i = 0; i < pagesToCreate.length; i += batchSize) {
      const batch = pagesToCreate.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from("landing_pages")
        .upsert(batch, { onConflict: "slug" });

      if (insertError) {
        console.error("Error inserting landing pages:", insertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${pagesToCreate.length} landing pages`,
      count: pagesToCreate.length,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/generate-landing-pages:", error);
    return NextResponse.json(
      { error: "Failed to generate landing pages" },
      { status: 500 }
    );
  }
}
