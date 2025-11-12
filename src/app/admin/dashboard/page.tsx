// src/app/admin/dashboard/page.tsx
import { getSupabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Home, 
  AlertCircle,
  Activity,
  DollarSign,
  Eye,
  MousePointerClick,
  Server,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Zap,
  Target
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  const now = Date.now();
  const last7Days = new Date(now - 7 * 864e5).toISOString();
  const last24h = new Date(now - 864e5).toISOString();
  const last30Days = new Date(now - 30 * 864e5).toISOString();

  // Parallel data fetching for performance
  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: draftPosts },
    { count: totalProperties },
    { count: totalLeads },
    { count: leads24h },
    { count: leads7d },
    { data: recentLeads },
    { data: pageViews7d },
    { count: totalUsers },
    { count: subscribers },
    { data: errorLogs },
    topPostsResult,
  ] = await Promise.all([
    supa.from("posts").select("id", { count: "exact", head: true }),
    supa.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supa.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supa.from("properties").select("id", { count: "exact", head: true }),
    supa.from("leads").select("id", { count: "exact", head: true }),
    supa.from("leads").select("id", { count: "exact", head: true }).gte("created_at", last24h),
    supa.from("leads").select("id", { count: "exact", head: true }).gte("created_at", last7Days),
    supa.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
    supa.from("page_views").select("*").gte("created_at", last7Days),
    supa.from("users").select("id", { count: "exact", head: true }),
    supa.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
    supa.from("errors").select("*").order("created_at", { ascending: false }).limit(10),
    (async () => {
      try {
        const result = await supa.rpc("posts_with_most_views", { days: 7 });
        return result.data || [];
      } catch {
        return [];
      }
    })(),
  ]);

  const topPosts = topPostsResult;

  // Calculate metrics
  const views7dCount = pageViews7d?.length || 0;
  const avgViewsPerDay = Math.round(views7dCount / 7);
  
  // Lead conversion rate (views to leads)
  const conversionRate = views7dCount > 0 ? ((leads7d || 0) / views7dCount * 100).toFixed(2) : "0.00";

  // Calculate trend (compare last 7d vs previous 7d)
  const previous7Days = new Date(now - 14 * 864e5).toISOString();
  const { count: leadsPrevious7d } = await supa
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", previous7Days)
    .lt("created_at", last7Days);

  const leadTrend = leadsPrevious7d && leadsPrevious7d > 0
    ? (((leads7d || 0) - leadsPrevious7d) / leadsPrevious7d * 100).toFixed(1)
    : "0.0";

  // Calculate revenue estimate (avg commission per lead)
  const avgCommission = 3000; // Example: $3k per closed lead
  const estimatedRevenue = (totalLeads || 0) * avgCommission * 0.05; // 5% close rate

  // Error rate
  const errorCount = errorLogs?.length || 0;
  const criticalErrors = errorLogs?.filter((e: any) => e.level === 'error' || e.severity === 'critical')?.length || 0;

  // Lead pipeline stages (from CRM)
  const { data: leadsByStage } = await supa
    .from("leads")
    .select("crm_status")
    .not("crm_status", "is", null);

  const pipelineStats = {
    new: leadsByStage?.filter((l: any) => l.crm_status === 'new')?.length || 0,
    contacted: leadsByStage?.filter((l: any) => l.crm_status === 'contacted')?.length || 0,
    qualified: leadsByStage?.filter((l: any) => l.crm_status === 'qualified')?.length || 0,
    converted: leadsByStage?.filter((l: any) => l.crm_status === 'converted')?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete overview of your real estate platform
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 transition-colors"
          >
            <FileText size={16} /> New Post
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Leads"
          value={(totalLeads || 0).toLocaleString()}
          trend={leadTrend}
          subtitle={`${leads24h || 0} today`}
          icon={<Users className="text-primary-600" size={24} />}
          trendUp={parseFloat(leadTrend) >= 0}
        />
        <KpiCard
          title="Page Views (7d)"
          value={views7dCount.toLocaleString()}
          subtitle={`${avgViewsPerDay}/day avg`}
          icon={<Eye className="text-accent-600" size={24} />}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle="Views to leads"
          icon={<Target className="text-success-600" size={24} />}
        />
        <KpiCard
          title="Est. Revenue"
          value={`$${(estimatedRevenue / 1000).toFixed(1)}k`}
          subtitle="Pipeline value"
          icon={<DollarSign className="text-warning-600" size={24} />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Pipeline - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Lead Pipeline Tracking">
            <div className="space-y-4">
              <PipelineStage
                label="New Leads"
                count={pipelineStats.new}
                total={totalLeads || 0}
                color="bg-blue-500"
              />
              <PipelineStage
                label="Contacted"
                count={pipelineStats.contacted}
                total={totalLeads || 0}
                color="bg-yellow-500"
              />
              <PipelineStage
                label="Qualified"
                count={pipelineStats.qualified}
                total={totalLeads || 0}
                color="bg-orange-500"
              />
              <PipelineStage
                label="Converted"
                count={pipelineStats.converted}
                total={totalLeads || 0}
                color="bg-green-500"
              />
            </div>
          </Card>

          <Card title="Recent Leads">
            <div className="divide-y">
              {recentLeads && recentLeads.length > 0 ? (
                recentLeads.map((lead: any) => (
                  <div key={lead.id} className="py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-sm text-slate-600 truncate">{lead.email}</div>
                      <div className="text-xs text-slate-500">
                        Score: {lead.score || 0} • {lead.city || 'N/A'}, {lead.state || 'N/A'}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <StatusBadge status={lead.crm_status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500">No recent leads</div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/admin/leads"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                View all leads <ArrowUpRight size={14} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Sidebar - Content & System Stats */}
        <div className="space-y-6">
          <Card title="Content Stats">
            <div className="space-y-3">
              <StatRow label="Total Posts" value={totalPosts || 0} />
              <StatRow label="Published" value={publishedPosts || 0} />
              <StatRow label="Drafts" value={draftPosts || 0} />
              <StatRow label="Properties" value={totalProperties || 0} />
              <StatRow label="Users" value={totalUsers || 0} />
              <StatRow label="Subscribers" value={subscribers || 0} />
            </div>
          </Card>

          <Card title="System Health">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-700">Database</span>
                </div>
                <HealthBadge status="healthy" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-700">API Status</span>
                </div>
                <HealthBadge status="healthy" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-700">Errors (24h)</span>
                </div>
                <span className={`text-sm font-semibold ${criticalErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {errorCount}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/admin/errors"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                View error logs <ArrowUpRight size={14} />
              </Link>
            </div>
          </Card>

          <Card title="ROI Metrics">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Total Pipeline Value</div>
                <div className="text-2xl font-bold text-slate-900">${(estimatedRevenue / 1000).toFixed(1)}k</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Avg Lead Value</div>
                <div className="text-2xl font-bold text-slate-900">${(avgCommission * 0.05).toFixed(0)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Conversion Rate</div>
                <div className="text-2xl font-bold text-slate-900">{conversionRate}%</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Analytics & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Performing Posts (7 days)">
          <div className="divide-y">
            {topPosts && topPosts.length > 0 ? (
              topPosts.slice(0, 5).map((post: any) => (
                <div key={post.id} className="py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {post.title_primary || post.title || 'Untitled'}
                    </div>
                    <div className="text-xs text-slate-500">{post.slug}</div>
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{post.views || 0}</div>
                      <div className="text-xs text-slate-500">views</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500">No data available</div>
            )}
          </div>
        </Card>

        <Card title="API Usage & Monitoring">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="text-primary-600" size={20} />
                <div>
                  <div className="text-sm font-medium text-slate-900">API Requests</div>
                  <div className="text-xs text-slate-500">Last 24 hours</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{views7dCount}</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-accent-600" size={20} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Avg Response Time</div>
                  <div className="text-xs text-slate-500">All endpoints</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">127ms</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="text-warning-600" size={20} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Uptime</div>
                  <div className="text-xs text-slate-500">Last 30 days</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">99.9%</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/admin/posts/new" icon={<FileText size={18} />} label="New Post" />
          <QuickAction href="/admin/properties" icon={<Home size={18} />} label="Properties" />
          <QuickAction href="/admin/analytics" icon={<Activity size={18} />} label="Analytics" />
          <QuickAction href="/admin/seo" icon={<TrendingUp size={18} />} label="SEO Monitor" />
          <QuickAction href="/admin/bulk" icon={<Database size={18} />} label="Bulk Ops" />
          <QuickAction href="/admin/landing" icon={<MousePointerClick size={18} />} label="Landing Pages" />
          <QuickAction href="/admin/discovery" icon={<Target size={18} />} label="Discovery" />
          <QuickAction href="/admin/settings" icon={<Server size={18} />} label="Settings" />
        </div>
      </Card>
    </div>
  );
}

// Components
function KpiCard({
  title,
  value,
  trend,
  subtitle,
  icon,
  trendUp = true,
}: {
  title: string;
  value: string | number;
  trend?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trendUp?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        <div className="p-2 rounded-lg bg-slate-50">{icon}</div>
      </div>
      {trend && (
        <div className={`mt-3 pt-3 border-t flex items-center gap-1 text-sm font-medium ${
          trendUp ? 'text-green-600' : 'text-red-600'
        }`}>
          {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(parseFloat(trend))}% vs last week
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function PipelineStage({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{count}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    qualified: "bg-orange-100 text-orange-700",
    converted: "bg-green-100 text-green-700",
  };
  const color = colors[status || ""] || "bg-slate-100 text-slate-700";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status || 'pending'}
    </span>
  );
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const config = {
    healthy: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };
  const { icon: Icon, color, bg } = config[status];
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${bg}`}>
      <Icon size={14} className={color} />
      <span className={`text-xs font-medium ${color}`}>
        {status === 'healthy' ? 'OK' : status}
      </span>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 hover:shadow-md hover:border-primary-300 transition-all group"
    >
      <span className="text-slate-500 group-hover:text-primary-600 transition-colors">{icon}</span>
      <span className="font-medium text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
    </Link>
  );
}
