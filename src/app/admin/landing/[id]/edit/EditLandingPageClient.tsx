"use client";

import { useState, useEffect } from "react";
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

export default function EditLandingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<LandingPageFormData>({
    city: "",
    state: "",
    slug: "",
    page_type: "homes-for-sale",
    title: "",
    description: "",
    content: "",
    meta_title: "",
    meta_description: "",
    status: "draft",
  });

  useEffect(() => {
    fetchPage();
  }, [id]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/admin/landing-pages/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPage(data.page);
      }
    } catch (error) {
      console.error("Error fetching landing page:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/landing-pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });

      if (response.ok) {
        alert("Landing page updated successfully!");
        router.push("/admin/landing");
      } else {
        alert("Failed to update landing page");
      }
    } catch (error) {
      console.error("Error saving landing page:", error);
      alert("Error saving landing page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/landing" className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Landing Page</h1>
            <p className="text-slate-600 mt-1">{page.title}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={page.slug}
            target="_blank"
            className="px-4 py-2 border rounded-lg hover:bg-slate-50"
          >
            Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input
              type="text"
              value={page.city}
              onChange={(e) => setPage({ ...page, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
            <input
              type="text"
              value={page.state}
              onChange={(e) => setPage({ ...page, state: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
            <input
              type="text"
              value={page.slug}
              onChange={(e) => setPage({ ...page, slug: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Page Type</label>
            <select
              value={page.page_type}
              onChange={(e) => setPage({ ...page, page_type: e.target.value })}
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={page.description}
              onChange={(e) => setPage({ ...page, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title</label>
            <input
              type="text"
              value={page.meta_title}
              onChange={(e) => setPage({ ...page, meta_title: e.target.value })}
              maxLength={60}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              Meta Description
            </label>
            <textarea
              value={page.meta_description}
              onChange={(e) => setPage({ ...page, meta_description: e.target.value })}
              rows={2}
              maxLength={160}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              {page.meta_description.length}/160 characters
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
          <textarea
            value={page.content}
            onChange={(e) => setPage({ ...page, content: e.target.value })}
            rows={12}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            placeholder="HTML or Markdown content..."
          />
        </div>
      </div>
    </div>
  );
}
