"use client";

import { useState } from "react";
import { Layers, FileText, Home, Sparkles, Upload, Download, RefreshCw, Trash2 } from "lucide-react";

export default function BulkOperationsPage() {
  const [activeTab, setActiveTab] = useState<"properties" | "blog" | "landing">("properties");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBulkGenerate = async (type: string) => {
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // Call the appropriate API endpoint
      const response = await fetch(`/api/admin/bulk-${type}`, {
        method: "POST",
      });
      
      if (response.ok) {
        alert(`Bulk ${type} generation completed!`);
      }
    } catch (error) {
      console.error(`Error in bulk ${type}:`, error);
      clearInterval(interval);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Layers className="text-primary-600" size={32} />
          Bulk Operations
        </h1>
        <p className="text-slate-600 mt-1">Perform bulk actions on properties, blog posts, and landing pages</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("properties")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "properties"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab("blog")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "blog"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Blog Posts
        </button>
        <button
          onClick={() => setActiveTab("landing")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "landing"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Landing Pages
        </button>
      </div>

      {/* Progress Bar */}
      {generating && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Processing...</span>
            <span className="text-sm font-medium text-primary-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BulkActionCard
            title="Generate AI Descriptions"
            description="Generate unique AI descriptions for all properties without descriptions"
            icon={<Sparkles className="text-purple-600" size={24} />}
            action={() => handleBulkGenerate("property-descriptions")}
            buttonText="Generate Descriptions"
            disabled={generating}
          />
          <BulkActionCard
            title="Update Property Photos"
            description="Sync and optimize all property images from Trestle API"
            icon={<Upload className="text-blue-600" size={24} />}
            action={() => handleBulkGenerate("property-photos")}
            buttonText="Update Photos"
            disabled={generating}
          />
          <BulkActionCard
            title="Sync All Properties"
            description="Sync all property data from Trestle API (may take several minutes)"
            icon={<RefreshCw className="text-green-600" size={24} />}
            action={() => handleBulkGenerate("property-sync")}
            buttonText="Start Sync"
            disabled={generating}
          />
          <BulkActionCard
            title="Export Properties"
            description="Export all properties to CSV format"
            icon={<Download className="text-orange-600" size={24} />}
            action={() => window.open("/api/admin/export-properties", "_blank")}
            buttonText="Export CSV"
            disabled={generating}
          />
          <BulkActionCard
            title="Generate Meta Tags"
            description="Generate SEO meta tags for all property pages"
            icon={<FileText className="text-indigo-600" size={24} />}
            action={() => handleBulkGenerate("property-meta")}
            buttonText="Generate Meta Tags"
            disabled={generating}
          />
          <BulkActionCard
            title="Remove Sold Properties"
            description="Archive properties that have been sold for over 90 days"
            icon={<Trash2 className="text-red-600" size={24} />}
            action={() => {
              if (confirm("Archive old sold properties? This cannot be undone.")) {
                handleBulkGenerate("archive-sold");
              }
            }}
            buttonText="Archive Properties"
            disabled={generating}
            variant="danger"
          />
        </div>
      )}

      {/* Blog Posts Tab */}
      {activeTab === "blog" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BulkActionCard
            title="Generate Blog Posts"
            description="Generate AI blog posts for top cities (20 posts)"
            icon={<Sparkles className="text-purple-600" size={24} />}
            action={() => handleBulkGenerate("blog-posts")}
            buttonText="Generate Posts"
            disabled={generating}
          />
          <BulkActionCard
            title="Update Featured Images"
            description="Add featured images to posts without images"
            icon={<Upload className="text-blue-600" size={24} />}
            action={() => handleBulkGenerate("blog-images")}
            buttonText="Update Images"
            disabled={generating}
          />
          <BulkActionCard
            title="Generate Meta Descriptions"
            description="Create SEO meta descriptions for all published posts"
            icon={<FileText className="text-green-600" size={24} />}
            action={() => handleBulkGenerate("blog-meta")}
            buttonText="Generate Meta"
            disabled={generating}
          />
          <BulkActionCard
            title="Export Posts"
            description="Export all blog posts to JSON format"
            icon={<Download className="text-orange-600" size={24} />}
            action={() => window.open("/api/admin/export-posts", "_blank")}
            buttonText="Export JSON"
            disabled={generating}
          />
          <BulkActionCard
            title="Internal Linking"
            description="Add internal links to properties in all posts"
            icon={<FileText className="text-indigo-600" size={24} />}
            action={() => handleBulkGenerate("blog-internal-links")}
            buttonText="Add Links"
            disabled={generating}
          />
          <BulkActionCard
            title="Delete Draft Posts"
            description="Remove all draft posts older than 30 days"
            icon={<Trash2 className="text-red-600" size={24} />}
            action={() => {
              if (confirm("Delete old draft posts? This cannot be undone.")) {
                handleBulkGenerate("delete-drafts");
              }
            }}
            buttonText="Delete Drafts"
            disabled={generating}
            variant="danger"
          />
        </div>
      )}

      {/* Landing Pages Tab */}
      {activeTab === "landing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BulkActionCard
            title="Generate Landing Pages"
            description="Generate 3000+ SEO-optimized landing pages for all cities"
            icon={<Sparkles className="text-purple-600" size={24} />}
            action={() => handleBulkGenerate("landing-pages")}
            buttonText="Generate Pages"
            disabled={generating}
          />
          <BulkActionCard
            title="Update City Descriptions"
            description="Regenerate AI descriptions for all city pages"
            icon={<FileText className="text-blue-600" size={24} />}
            action={() => handleBulkGenerate("city-descriptions")}
            buttonText="Update Descriptions"
            disabled={generating}
          />
          <BulkActionCard
            title="Generate FAQs"
            description="Add 10 FAQ questions to each landing page"
            icon={<FileText className="text-green-600" size={24} />}
            action={() => handleBulkGenerate("landing-faqs")}
            buttonText="Generate FAQs"
            disabled={generating}
          />
          <BulkActionCard
            title="Update Hero Images"
            description="Fetch and update hero images for all cities from Unsplash"
            icon={<Upload className="text-orange-600" size={24} />}
            action={() => handleBulkGenerate("landing-images")}
            buttonText="Update Images"
            disabled={generating}
          />
          <BulkActionCard
            title="Generate Sitemaps"
            description="Regenerate XML sitemaps for all landing pages"
            icon={<FileText className="text-indigo-600" size={24} />}
            action={() => handleBulkGenerate("sitemaps")}
            buttonText="Generate Sitemaps"
            disabled={generating}
          />
          <BulkActionCard
            title="Update Schema Markup"
            description="Add/update schema.org markup for all landing pages"
            icon={<FileText className="text-teal-600" size={24} />}
            action={() => handleBulkGenerate("schema-markup")}
            buttonText="Update Schema"
            disabled={generating}
          />
        </div>
      )}
    </div>
  );
}

function BulkActionCard({
  title,
  description,
  icon,
  action,
  buttonText,
  disabled,
  variant = "primary",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  buttonText: string;
  disabled: boolean;
  variant?: "primary" | "danger";
}) {
  const buttonClasses =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-primary-600 hover:bg-primary-700 text-white";

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600 mb-4">{description}</p>
          <button
            onClick={action}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
