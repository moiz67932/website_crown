// API endpoint to get REAL admin statistics from database
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Date ranges for trend calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get real data from database tables
    const [
      propertiesData,
      postsData,
      landingPagesData,
      leadsData,
      pageViewsData,
      usersData,
      // Previous period data for trends
      propertiesPrevious,
      postsPrevious,
      landingPagesPrevious,
    ] = await Promise.all([
      // Properties stats
      supabase.from("properties").select("id, status, created_at", { count: "exact" }),
      
      // Blog posts stats
      supabase.from("posts").select("id, status, views", { count: "exact" }),
      
      // Landing pages stats
      supabase.from("landing_pages").select("id, status, views, created_at", { count: "exact" }),
      
      // Leads stats (last 30 days for "this month")
      supabase.from("leads").select("id, status, created_at", { count: "exact" }),
      
      // Page views for traffic stats
      supabase.from("page_views").select("*"),
      
      // Users count
      supabase.from("auth.users").select("id", { count: "exact", head: true }),

      // Previous period data
      supabase.from("properties").select("id", { count: "exact", head: true }).lt("created_at", thirtyDaysAgo.toISOString()).gte("created_at", sixtyDaysAgo.toISOString()),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published").lt("created_at", thirtyDaysAgo.toISOString()).gte("created_at", sixtyDaysAgo.toISOString()),
      supabase.from("landing_pages").select("id", { count: "exact", head: true }).eq("status", "published").lt("created_at", thirtyDaysAgo.toISOString()).gte("created_at", sixtyDaysAgo.toISOString()),
    ]);

    // Calculate real property stats
    const properties = propertiesData.data || [];
    const propertiesThisMonth = properties.filter((p: any) => 
      p.created_at && new Date(p.created_at) >= thirtyDaysAgo
    ).length;
    const propertiesPreviousCount = propertiesPrevious.count || 0;
    const propertyTrend = propertiesPreviousCount > 0
      ? Math.round(((propertiesThisMonth - propertiesPreviousCount) / propertiesPreviousCount) * 100)
      : (propertiesThisMonth > 0 ? 100 : 0);

    const propertyStats = {
      total: propertiesData.count || 0,
      active: properties.filter((p: any) => 
        p.status === 'Active' || p.status === 'active' || p.status === 'for_sale'
      ).length,
      sold: properties.filter((p: any) => 
        p.status === 'Sold' || p.status === 'sold'
      ).length,
      pending: properties.filter((p: any) => 
        p.status === 'Pending' || p.status === 'pending' || p.status === 'under_contract'
      ).length,
      trend: propertyTrend,
    };

    // Calculate real blog stats
    const posts = postsData.data || [];
    const postsPublished = posts.filter((p: any) => p.status === 'published').length;
    const postsPreviousCount = postsPrevious.count || 0;
    const blogTrend = postsPreviousCount > 0
      ? Math.round(((postsPublished - postsPreviousCount) / postsPreviousCount) * 100)
      : (postsPublished > 0 ? 100 : 0);

    const blogStats = {
      total: postsData.count || 0,
      published: postsPublished,
      draft: posts.filter((p: any) => p.status === 'draft').length,
      views: posts.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
      trend: blogTrend,
    };

    // Calculate real landing page stats
    const landingPages = landingPagesData.data || [];
    const landingPagesPublished = landingPages.filter((p: any) => p.status === 'published').length;
    const landingPagesThisMonth = landingPages.filter((p: any) => 
      p.created_at && new Date(p.created_at) >= thirtyDaysAgo && p.status === 'published'
    ).length;
    const landingPagesPreviousCount = landingPagesPrevious.count || 0;
    const landingTrend = landingPagesPreviousCount > 0
      ? landingPagesThisMonth - landingPagesPreviousCount
      : landingPagesThisMonth;

    const landingStats = {
      total: landingPagesData.count || 0,
      published: landingPagesPublished,
      views: landingPages.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
      trend: landingTrend, // Show absolute number for landing pages
    };

    // Calculate real lead stats
    const leads = leadsData.data || [];
    
    const leadsThisMonth = leads.filter((l: any) => 
      new Date(l.created_at) >= thirtyDaysAgo
    ).length;

    const leadsPreviousMonth = leads.filter((l: any) => {
      const createdDate = new Date(l.created_at);
      return createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo;
    }).length;

    const leadsConverted = leads.filter((l: any) => 
      l.status === 'converted' || l.status === 'closed' || l.status === 'won'
    ).length;

    // Calculate lead trend
    const leadTrend = leadsPreviousMonth > 0
      ? Math.round(((leadsThisMonth - leadsPreviousMonth) / leadsPreviousMonth) * 100)
      : (leadsThisMonth > 0 ? 100 : 0);

    const leadStats = {
      total: leadsData.count || 0,
      thisMonth: leadsThisMonth,
      converted: leadsConverted,
      trend: leadTrend,
    };

    // Calculate real traffic stats
    const pageViews = pageViewsData.data || [];
    const uniqueVisitors = new Set(pageViews.map((v: any) => v.visitor_id || v.session_id)).size;
    
    // Calculate average session time (in seconds)
    const sessionTimes = pageViews
      .filter((v: any) => v.time_on_page && v.time_on_page > 0)
      .map((v: any) => v.time_on_page);
    const avgSessionTime = sessionTimes.length > 0
      ? Math.round(sessionTimes.reduce((a: number, b: number) => a + b, 0) / sessionTimes.length)
      : 0;

    // Calculate bounce rate (pages with < 10 seconds view time)
    const bounces = pageViews.filter((v: any) => (v.time_on_page || 0) < 10).length;
    const bounceRate = pageViews.length > 0
      ? Math.round((bounces / pageViews.length) * 100)
      : 0;

    const trafficStats = {
      totalViews: pageViews.length,
      uniqueVisitors: uniqueVisitors,
      avgSessionTime: avgSessionTime,
      bounceRate: bounceRate,
    };

    return NextResponse.json({
      properties: propertyStats,
      blog: blogStats,
      landing: landingStats,
      leads: leadStats,
      traffic: trafficStats,
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
