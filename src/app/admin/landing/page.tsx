"use client";

import { useState, useEffect } from "react";
import { Home, Search, Plus, Eye, Edit, Trash2, RefreshCw, TrendingUp } from "lucide-react";
import Link from "next/link";

interface LandingPage {
  id: string;
  city: string;
  state: string;
  slug: string;
  page_type: string;
  title: string;
  description: string;
  property_count?: number;
  views?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function LandingPagesManagementPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchLandingPages();
  }, [typeFilter]);

  const fetchLandingPages = async () => {
    setLoading(true);
    try {
      // Fetch REAL landing pages from API
      const response = await fetch(`/api/admin/landing-pages?type=${typeFilter}`);
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      } else {
        throw new Error("Failed to fetch landing pages");
      }
    } catch (error) {
      console.error("Error fetching landing pages:", error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = pages.filter((page) =>
    searchQuery === "" ||
    page.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.page_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft: pages.filter(p => p.status === 'draft').length,
    totalViews: pages.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  const handleGeneratePages = async () => {
    if (confirm("Generate landing pages for all California cities? This may take a while.")) {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/generate-landing-pages", {
          method: "POST",
        });
        if (response.ok) {
          const result = await response.json();
          alert(`Landing page generation complete! Created ${result.successCount} pages.`);
          fetchLandingPages();
        } else {
          const error = await response.json();
          alert(`Failed to generate pages: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error generating pages:", error);
        alert("Error generating landing pages");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegenerateContent = async (pageId: string, city: string, kind: string) => {
    if (confirm(`Regenerate AI content for ${city} - ${kind}?`)) {
      try {
        const response = await fetch(`/api/admin/landing-pages/${pageId}/regenerate`, {
          method: "POST",
        });
        if (response.ok) {
          alert("Content regenerated successfully!");
          fetchLandingPages();
        } else {
          alert("Failed to regenerate content");
        }
      } catch (error) {
        console.error("Error regenerating content:", error);
        alert("Error regenerating content");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Home className="text-primary-600" size={32} />
            Landing Pages Management
          </h1>
          <p className="text-slate-600 mt-1">Manage SEO-optimized landing pages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGeneratePages}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={18} />
            Generate Pages
          </button>
          <Link
            href="/admin/landing/new"
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-slate-50"
          >
            <Plus size={18} />
            Create Manual
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Pages" value={stats.total} color="blue" />
        <StatCard title="Published" value={stats.published} color="green" />
        <StatCard title="Draft" value={stats.draft} color="orange" />
        <StatCard title="Total Views" value={stats.totalViews} color="purple" />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Home className="text-blue-600 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">AI-Generated Landing Pages</h3>
            <p className="text-sm text-blue-700">
              Landing pages are automatically generated for California cities using AI. Each page includes SEO-optimized content,
              property listings, and local insights. Click "Generate Pages" to create pages for all configured cities,
              or use the regenerate button to refresh AI content for individual pages.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by city, slug, or page type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="homes-for-sale">Homes for Sale</option>
            <option value="condos-for-sale">Condos for Sale</option>
            <option value="luxury-homes">Luxury Homes</option>
            <option value="homes-with-pool">Homes with Pool</option>
            <option value="homes-under-500k">Homes Under $500k</option>
            <option value="homes-over-1m">Homes Over $1M</option>
            <option value="2-bedroom-apartments">2-Bedroom Apartments</option>
          </select>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-primary-600" size={32} />
            <p className="text-slate-600">Loading landing pages...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-12 text-center">
            <Home className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-600">No landing pages found</p>
            <button
              onClick={handleGeneratePages}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Generate Your First Pages
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Page</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">City</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Properties</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Views</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{page.title}</div>
                      <div className="text-sm text-slate-500">{page.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {page.city}, {page.state}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                        {page.page_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {page.property_count?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-700 flex items-center gap-1">
                      <TrendingUp size={14} className="text-green-600" />
                      {page.views?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={page.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={page.slug}
                          target="_blank"
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                          title="View"
                        >
                          <Eye size={16} className="text-slate-600" />
                        </Link>
                        <button
                          onClick={() => handleRegenerateContent(page.id, page.city, page.page_type)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                          title="Regenerate AI Content"
                        >
                          <RefreshCw size={16} className="text-slate-600" />
                        </button>
                        <Link
                          href={`/admin/landing/${page.id}/edit`}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} className="text-slate-600" />
                        </Link>
                      </div>
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

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
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
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    published: "bg-green-100 text-green-700 border-green-200",
    draft: "bg-orange-100 text-orange-700 border-orange-200",
  }[status] || "bg-slate-100 text-slate-700 border-slate-200";

  const label = status === "published" ? "Published" : "Draft (No AI Content)";

  return (
    <span className={`px-2 py-1 text-xs font-medium border rounded ${colors}`}>
      {label}
    </span>
  );
}
