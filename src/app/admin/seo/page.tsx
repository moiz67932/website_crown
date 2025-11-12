"use client";

import { useState, useEffect } from "react";
import { SearchCheck, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface SEOMetric {
  page_url: string;
  page_title: string;
  meta_description: string;
  keywords: string[];
  google_rank?: number;
  page_views: number;
  avg_time_on_page: number;
  bounce_rate: number;
  indexed: boolean;
  sitemap_included: boolean;
  schema_markup: boolean;
  mobile_friendly: boolean;
  page_speed_score: number;
  issues: string[];
}

export default function SEOMonitorPage() {
  const [metrics, setMetrics] = useState<SEOMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIssues, setFilterIssues] = useState(false);

  useEffect(() => {
    fetchSEOMetrics();
  }, []);

  const fetchSEOMetrics = async () => {
    setLoading(true);
    try {
      // Fetch REAL data from API
      const response = await fetch("/api/admin/seo-metrics");
      if (!response.ok) throw new Error("Failed to fetch SEO metrics");
      
      const data = await response.json();
      setMetrics(data || []);
    } catch (error) {
      console.error("Error fetching SEO metrics:", error);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMetrics = filterIssues
    ? metrics.filter((m) => m.issues.length > 0)
    : metrics;

  const stats = {
    totalPages: metrics.length,
    indexed: metrics.filter((m) => m.indexed).length,
    withIssues: metrics.filter((m) => m.issues.length > 0).length,
    avgPageSpeed: Math.round(
      metrics.reduce((sum, m) => sum + m.page_speed_score, 0) / metrics.length
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <SearchCheck className="text-primary-600" size={32} />
            SEO Monitor
          </h1>
          <p className="text-slate-600 mt-1">Track SEO performance and optimization</p>
        </div>
        <button
          onClick={fetchSEOMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <RefreshCw size={18} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Pages" value={stats.totalPages} color="blue" />
        <StatCard title="Indexed Pages" value={stats.indexed} color="green" />
        <StatCard title="Pages with Issues" value={stats.withIssues} color="orange" />
        <StatCard title="Avg Page Speed" value={stats.avgPageSpeed} color="purple" suffix="/100" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterIssues}
            onChange={(e) => setFilterIssues(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-slate-700">Show only pages with issues</span>
        </label>
      </div>

      {/* SEO Metrics Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-primary-600" size={32} />
            <p className="text-slate-600">Loading SEO metrics...</p>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="p-12 text-center">
            <SearchCheck className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-600">No pages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Page</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Rank</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Views</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Bounce Rate</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Speed</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMetrics.map((metric, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{metric.page_title}</div>
                      <div className="text-sm text-slate-500">{metric.page_url}</div>
                      <div className="text-xs text-slate-400 mt-1">{metric.meta_description}</div>
                    </td>
                    <td className="px-4 py-3">
                      {metric.google_rank ? (
                        <span className="font-semibold text-slate-900">#{metric.google_rank}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{metric.page_views.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${
                          metric.bounce_rate < 40
                            ? "text-green-600"
                            : metric.bounce_rate < 60
                            ? "text-orange-600"
                            : "text-red-600"
                        }`}
                      >
                        {metric.bounce_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              metric.page_speed_score >= 80
                                ? "bg-green-500"
                                : metric.page_speed_score >= 50
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${metric.page_speed_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {metric.page_speed_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusIcon status={metric.indexed} label="Indexed" />
                        <StatusIcon status={metric.schema_markup} label="Schema" />
                        <StatusIcon status={metric.mobile_friendly} label="Mobile" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {metric.issues.length > 0 ? (
                        <div className="space-y-1">
                          {metric.issues.map((issue, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-red-600">
                              <AlertCircle size={12} />
                              {issue}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <CheckCircle size={14} />
                          No issues
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  suffix = "",
}: {
  title: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  }[color];

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
      <div className={`text-3xl font-bold bg-gradient-to-r ${colorClasses} bg-clip-text text-transparent`}>
        {value.toLocaleString()}
        {suffix}
      </div>
    </div>
  );
}

function StatusIcon({ status, label }: { status: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {status ? (
        <CheckCircle size={12} className="text-green-600" />
      ) : (
        <AlertCircle size={12} className="text-red-600" />
      )}
      <span className={status ? "text-green-700" : "text-red-700"}>{label}</span>
    </div>
  );
}
