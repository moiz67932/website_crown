import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/landing-pages
 * Fetch all landing pages with optional filtering and property counts
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
      .order("updated_at", { ascending: false });

    // Filter by kind/page_name (the actual column in the database)
    if (type && type !== "all") {
      query = query.eq("kind", type);
    }

    const { data: pages, error } = await query;

    if (error) {
      console.error("Error fetching landing pages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get property counts for each city
    const propertyCounts: Record<string, number> = {};
    if (pages && pages.length > 0) {
      const cities = [...new Set(pages.map((p: any) => p.city))];
      
      for (const city of cities) {
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .ilike("city", city);
        
        propertyCounts[city] = count || 0;
      }
    }

    // Transform the data to match the frontend expectations
    const transformedPages = (pages || []).map((page: any) => {
      // Read from content JSON
      const contentJson = page.content && typeof page.content === 'object' ? page.content : null;
      const seo = contentJson?.seo || {};
      
      return {
        id: page.id,
        city: page.city,
        state: "CA", // Most pages are CA
        slug: `/california/${page.city.toLowerCase().replace(/\s+/g, '-')}/${page.kind || page.page_name}`,
        page_type: page.kind || page.page_name,
        title: seo.title || generateTitle(page.city, page.kind || page.page_name),
        description: seo.meta_description || contentJson?.intro?.subheadline || extractDescription(contentJson),
        property_count: propertyCounts[page.city] || 0,
        views: 0, // TODO: Track views
        status: contentJson ? "published" : "draft",
        created_at: page.created_at,
        updated_at: page.updated_at,
      };
    });

    return NextResponse.json({ pages: transformedPages });
  } catch (error) {
    console.error("Error in GET /api/admin/landing-pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing pages" },
      { status: 500 }
    );
  }
}

// Helper function to generate title from city and kind
function generateTitle(city: string, kind: string): string {
  const cityTitle = city.replace(/\b\w/g, (c) => c.toUpperCase());
  const kindTitle = kind
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `${kindTitle} in ${cityTitle}, CA`;
}

// Helper function to extract description from content JSON
function extractDescription(content: any): string {
  if (!content) return "";
  // If content is string (legacy), strip HTML tags
  if (typeof content === 'string') {
    const stripped = content.replace(/<[^>]*>/g, "");
    return stripped.slice(0, 200);
  }
  // If content is object (new format), extract from sections or intro
  return content.intro?.subheadline || content.seo?.meta_description || "";
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

    // Transform the frontend data to match the database schema - store in content JSON
    // Build content object
    const contentObj = body.content ? (
      typeof body.content === 'object' ? body.content : {
        seo: {
          title: body.meta_title || body.title,
          meta_description: body.meta_description || body.description,
        }
      }
    ) : {
      seo: {
        title: body.meta_title || body.title,
        meta_description: body.meta_description || body.description,
      }
    };

    const pageData = {
      city: body.city,
      page_name: body.page_type,
      kind: body.page_type,
      // Store content as stringified JSON (content column is TEXT type)
      content: JSON.stringify(contentObj),
    };

    const { data, error } = await supabase
      .from("landing_pages")
      .insert(pageData)
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
