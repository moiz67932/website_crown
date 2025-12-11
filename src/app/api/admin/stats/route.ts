// API endpoint to get REAL admin statistics from database
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getPgPool } from "@/lib/db/connection";

export const dynamic = 'force-dynamic';

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

    // Fetch properties from PostgreSQL (same source as admin properties page)
    let propertyStats = { total: 0, active: 0, sold: 0, pending: 0 };
    let propertiesPreviousCount = 0;
    
    try {
      const pool = await getPgPool();
      
      // Get current property stats
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE LOWER(status) = 'active') as active,
          COUNT(*) FILTER (WHERE LOWER(status) = 'sold') as sold,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('pending', 'under contract', 'contingent')) as pending
        FROM properties
      `;
      const statsResult = await pool.query(statsQuery);
      propertyStats = {
        total: parseInt(statsResult.rows[0]?.total || '0'),
        active: parseInt(statsResult.rows[0]?.active || '0'),
        sold: parseInt(statsResult.rows[0]?.sold || '0'),
        pending: parseInt(statsResult.rows[0]?.pending || '0'),
      };

      // Get previous period count for trend
      const previousQuery = `
        SELECT COUNT(*) as count 
        FROM properties 
        WHERE created_at < $1 AND created_at >= $2
      `;
      const previousResult = await pool.query(previousQuery, [thirtyDaysAgo.toISOString(), sixtyDaysAgo.toISOString()]);
      propertiesPreviousCount = parseInt(previousResult.rows[0]?.count || '0');
    } catch (error) {
      console.error("Error fetching properties from PostgreSQL:", error);
    }

    // Get real data from Supabase tables
    const [
      postsData,
      landingPagesData,
      leadsData,
      pageViewsData,
      // Previous period data for trends
      postsPrevious,
      landingPagesPrevious,
    ] = await Promise.all([
      // Blog posts stats - no views column in posts table
      supabase.from("posts").select("id, status, created_at", { count: "exact" }),
      
      // Landing pages stats - select id and content to check if page has content
      supabase.from("landing_pages").select("id, content", { count: "exact" }),
      
      // Leads stats (last 30 days for "this month")
      supabase.from("leads").select("id, status, created_at", { count: "exact" }),
      
      // Page views for traffic stats
      supabase.from("page_views").select("*"),

      // Previous period data
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published").lt("created_at", thirtyDaysAgo.toISOString()).gte("created_at", sixtyDaysAgo.toISOString()),
      // Landing pages don't have created_at, skip previous period comparison
      Promise.resolve({ count: 0 }),
    ]);

    // Log errors if any
    if (postsData.error) console.error("Posts error:", postsData.error);
    if (landingPagesData.error) console.error("Landing pages error:", landingPagesData.error);
    if (leadsData.error) console.error("Leads error:", leadsData.error);
    if (pageViewsData.error) console.error("Page views error:", pageViewsData.error);

    // Get page views data once for reuse
    const pageViews = pageViewsData.data || [];

    // Calculate property trend
    const propertiesThisMonth = propertyStats.total; // Current active properties
    const propertyTrend = propertiesPreviousCount > 0
      ? Math.round(((propertiesThisMonth - propertiesPreviousCount) / propertiesPreviousCount) * 100)
      : (propertiesThisMonth > 0 ? 100 : 0);

    // Add trend to property stats
    const finalPropertyStats = {
      ...propertyStats,
      trend: propertyTrend,
    };

    // Calculate real blog stats
    const posts = postsData.data || [];
    const postsPublished = posts.filter((p: any) => p.status === 'published').length;
    const postsPreviousCount = postsPrevious.count || 0;
    const blogTrend = postsPreviousCount > 0
      ? Math.round(((postsPublished - postsPreviousCount) / postsPreviousCount) * 100)
      : (postsPublished > 0 ? 100 : 0);

    // Calculate blog views from page_views table
    const blogViews = pageViews.filter((v: any) => v.post_id).length;

    const blogStats = {
      total: postsData.count || 0,
      published: postsPublished,
      draft: posts.filter((p: any) => p.status === 'draft').length,
      views: blogViews,
      trend: blogTrend,
    };

    // Calculate real landing page stats
    const landingPages = landingPagesData.data || [];
    // Landing pages are "published" if they have content
    const landingPagesPublished = landingPages.filter((p: any) => p.content && (typeof p.content === 'object' || (typeof p.content === 'string' && p.content.trim() !== ''))).length;
    const landingPagesPreviousCount = landingPagesPrevious.count || 0;
    // Since no created_at, can't calculate this month trend, just show change from baseline
    const landingTrend = landingPagesPublished - landingPagesPreviousCount;

    const landingStats = {
      total: landingPagesData.count || 0,
      published: landingPagesPublished,
      views: 0, // TODO: Track landing page views
      trend: landingTrend,
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
      properties: finalPropertyStats,
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
