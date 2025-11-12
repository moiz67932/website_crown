import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/landing-pages
 * Fetch all landing pages with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("landing_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("page_type", type);
    }

    const { data: pages, error } = await query;

    if (error) {
      console.error("Error fetching landing pages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pages: pages || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/landing-pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing pages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/landing-pages
 * Create a new landing page
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("landing_pages")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("Error creating landing page:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ page: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/landing-pages:", error);
    return NextResponse.json(
      { error: "Failed to create landing page" },
      { status: 500 }
    );
  }
}
