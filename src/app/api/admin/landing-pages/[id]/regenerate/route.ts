import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/landing-pages/[id]/regenerate
 * 
 * DEPRECATED: This route now redirects to the new JSON generator.
 * The new generator uses:
 * - Hybrid model fallback (gpt-5-mini → gpt-4o-mini)
 * - Real Cloud SQL data via buildInputJson()
 * - Strict JSON schema validation
 * 
 * For backward compatibility, this route fetches the landing page,
 * calls the new generator, and updates the database.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.warn("[regenerate] DEPRECATED: Legacy regenerate route called. Redirecting to new JSON generator.");
  
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { id } = await params;

    // Fetch the landing page to get city and kind
    const { data: page, error: fetchError } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !page) {
      return NextResponse.json(
        { error: "Landing page not found" },
        { status: 404 }
      );
    }

    const city = page.city;
    const kind = page.kind || page.page_name || page.page_type;

    if (!city || !kind) {
      return NextResponse.json(
        { error: "Landing page missing city or kind" },
        { status: 400 }
      );
    }

    // Call the new JSON generator internally
    const baseUrl = request.nextUrl.origin;
    const generateResponse = await fetch(`${baseUrl}/api/admin/landing-pages/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        kind,
        format: "json",
        pageId: id,
      }),
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json().catch(() => ({}));
      console.error("[regenerate] New generator failed:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to generate content", details: errorData.details },
        { status: generateResponse.status }
      );
    }

    const result = await generateResponse.json();

    // Return response in legacy format for backward compatibility
    // Include both old and new fields
    return NextResponse.json({
      success: true,
      // New structured content
      content: result.content,
      title: result.title,
      meta_title: result.meta_title,
      meta_description: result.meta_description,
      // Metadata
      _metadata: result._metadata,
      model_used: result._metadata?.model_used,
      fallback_attempted: result._metadata?.fallback_attempted,
    });
  } catch (error) {
    console.error("[regenerate] Error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate content" },
      { status: 500 }
    );
  }
}
