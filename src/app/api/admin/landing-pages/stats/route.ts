import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/landing-pages/stats
 * Get statistics about landing pages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Get total count
    const { count: total } = await supabase
      .from("landing_pages")
      .select("*", { count: "exact", head: true });

    // Count by kind (since we don't have status field, all are considered published)
    const { data: allPages } = await supabase
      .from("landing_pages")
      .select("kind, ai_description_html");

    const published = allPages?.filter(p => p.ai_description_html)?.length || 0;
    const draft = (total || 0) - published;

    return NextResponse.json({
      total: total || 0,
      published,
      draft,
      totalViews: 0, // TODO: Implement view tracking
    });
  } catch (error) {
    console.error("Error in GET /api/admin/landing-pages/stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
