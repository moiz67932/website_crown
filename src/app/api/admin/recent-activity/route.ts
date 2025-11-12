// API endpoint to get REAL recent activity from database
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface Activity {
  type: string;
  title: string;
  description: string;
  time: string;
  icon: string;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const activities: Activity[] = [];

    // Get recent properties
    const { data: recentProperties } = await supabase
      .from("properties")
      .select("address, city, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentProperties) {
      recentProperties.forEach((prop: any) => {
        activities.push({
          type: "property",
          title: "New property added",
          description: `${prop.address}, ${prop.city}`,
          time: prop.created_at,
          icon: "building",
        });
      });
    }

    // Get recent blog posts
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("title, status, created_at, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (recentPosts) {
      recentPosts.forEach((post: any) => {
        activities.push({
          type: "post",
          title: "Blog post published",
          description: post.title,
          time: post.updated_at,
          icon: "fileText",
        });
      });
    }

    // Get recent landing pages
    const { data: recentLandingPages } = await supabase
      .from("landing_pages")
      .select("city, page_type, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentLandingPages) {
      // Group by date to show bulk generation
      const landingPagesByDate: { [key: string]: any[] } = {};
      recentLandingPages.forEach((page: any) => {
        const date = new Date(page.created_at).toDateString();
        if (!landingPagesByDate[date]) {
          landingPagesByDate[date] = [];
        }
        landingPagesByDate[date].push(page);
      });

      Object.entries(landingPagesByDate).forEach(([date, pages]) => {
        if (pages.length > 1) {
          activities.push({
            type: "landing",
            title: "Landing pages generated",
            description: `${pages.length} new city pages created`,
            time: pages[0].created_at,
            icon: "home",
          });
        } else {
          activities.push({
            type: "landing",
            title: "Landing page created",
            description: `${pages[0].city} - ${pages[0].page_type}`,
            time: pages[0].created_at,
            icon: "home",
          });
        }
      });
    }

    // Get recent leads
    const { data: recentLeads } = await supabase
      .from("leads")
      .select("name, email, message, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentLeads) {
      recentLeads.forEach((lead: any) => {
        const message = lead.message 
          ? (lead.message.length > 50 ? lead.message.substring(0, 50) + "..." : lead.message)
          : "Contact inquiry";
        
        activities.push({
          type: "lead",
          title: "New lead captured",
          description: `${lead.name || lead.email} - ${message}`,
          time: lead.created_at,
          icon: "users",
        });
      });
    }

    // Sort all activities by time (most recent first)
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Return top 10 most recent
    return NextResponse.json(activities.slice(0, 10));

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
