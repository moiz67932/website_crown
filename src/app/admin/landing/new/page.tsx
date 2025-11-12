"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";

interface LandingPageFormData {
  city: string;
  state: string;
  slug: string;
  page_type: string;
  title: string;
  description: string;
  content: string;
  meta_title: string;
  meta_description: string;
  status: string;
}

export default function NewLandingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<LandingPageFormData>({
    city: "",
    state: "CA",
    slug: "",
    page_type: "homes-for-sale",
    title: "",
    description: "",
    content: "",
    meta_title: "",
    meta_description: "",
    status: "draft",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Landing page created successfully!");
        router.push(`/admin/landing/${data.page.id}/edit`);
      } else {
        alert("Failed to create landing page");
      }
    } catch (error) {
      console.error("Error creating landing page:", error);
      alert("Error creating landing page");
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate slug from city and page type
  const updateSlug = (city: string, pageType: string) => {
    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    setPage({ ...page, slug: `/${citySlug}/${pageType}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/landing" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Landing Page</h1>
            <p className="text-slate-600 mt-1">Create a new SEO-optimized landing page</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !page.city || !page.title}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Creating..." : "Create Page"}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
            <input
              type="text"
              value={page.city}
              onChange={(e) => {
                setPage({ ...page, city: e.target.value });
                updateSlug(e.target.value, page.page_type);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Orange"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
            <input
              type="text"
              value={page.state}
              onChange={(e) => setPage({ ...page, state: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Page Type</label>
            <select
              value={page.page_type}
              onChange={(e) => {
                setPage({ ...page, page_type: e.target.value });
                updateSlug(page.city, e.target.value);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="homes-for-sale">Homes for Sale</option>
              <option value="condos-for-sale">Condos for Sale</option>
              <option value="luxury-homes">Luxury Homes</option>
              <option value="homes-with-pool">Homes with Pool</option>
              <option value="homes-under-500k">Homes Under $500k</option>
              <option value="homes-over-1m">Homes Over $1M</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
            <input
              type="text"
              value={page.slug}
              onChange={(e) => setPage({ ...page, slug: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="/city/page-type"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Homes for Sale in Orange, CA"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={page.description}
              onChange={(e) => setPage({ ...page, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Brief description of the page..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meta Title (SEO)
            </label>
            <input
              type="text"
              value={page.meta_title}
              onChange={(e) => setPage({ ...page, meta_title: e.target.value })}
              maxLength={60}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Max 60 characters"
            />
            <p className="text-xs text-slate-500 mt-1">{page.meta_title.length}/60 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={page.status}
              onChange={(e) => setPage({ ...page, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meta Description (SEO)
            </label>
            <textarea
              value={page.meta_description}
              onChange={(e) => setPage({ ...page, meta_description: e.target.value })}
              rows={2}
              maxLength={160}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Max 160 characters"
            />
            <p className="text-xs text-slate-500 mt-1">
              {page.meta_description.length}/160 characters
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Content (Optional)
          </label>
          <textarea
            value={page.content}
            onChange={(e) => setPage({ ...page, content: e.target.value })}
            rows={12}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            placeholder="HTML or Markdown content... (can be generated later with AI)"
          />
        </div>
      </div>
    </div>
  );
}
