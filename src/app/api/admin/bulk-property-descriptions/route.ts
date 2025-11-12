import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bulk-property-descriptions
 * Generate AI descriptions for properties without descriptions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Get properties without descriptions
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, address, city, state, price, bedrooms, bathrooms")
      .or("description.is.null,description.eq.");

    if (error) {
      console.error("Error fetching properties:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Generate AI descriptions using OpenAI
    // For now, return count
    return NextResponse.json({
      success: true,
      message: `Found ${properties?.length || 0} properties without descriptions`,
      count: properties?.length || 0,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/bulk-property-descriptions:", error);
    return NextResponse.json(
      { error: "Failed to generate property descriptions" },
      { status: 500 }
    );
  }
}
