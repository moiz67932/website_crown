import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAIDescription } from "@/lib/landing/ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/landing-pages/[id]/regenerate
 * Regenerate AI content for a landing page
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { id } = await params;

    // Fetch the landing page
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

    // Regenerate AI content
    const aiDescription = await getAIDescription(
      page.city,
      page.kind || page.page_name,
      { forceRegenerate: true }
    );

    // Update the page
    const { error: updateError } = await supabase
      .from("landing_pages")
      .update({
        ai_description_html: aiDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ai_description_html: aiDescription,
    });
  } catch (error) {
    console.error("Error regenerating landing page:", error);
    return NextResponse.json(
      { error: "Failed to regenerate content" },
      { status: 500 }
    );
  }
}
