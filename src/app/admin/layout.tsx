// src/app/admin/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  GaugeCircle,
  Building2,
  FileText,
  Home,
  Layers,
  Settings,
  LineChart,
  SearchCheck,
  Users,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-white font-bold shadow-lg">
                CC
              </span>
              <div>
                <div className="font-bold tracking-tight text-lg">Crown Coastal</div>
                <div className="text-xs text-slate-600">Admin Dashboard</div>
              </div>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700 transition">
              Dashboard
            </Link>
            <Link href="/admin/posts" className="hover:text-slate-900 transition">
              Posts
            </Link>
            <Link href="/admin/properties" className="hover:text-slate-900 transition">
              Properties
            </Link>
            <Link href="/admin/leads" className="hover:text-slate-900 transition">
              Leads
            </Link>
            <Link href="/admin/analytics" className="hover:text-slate-900 transition">
              Analytics
            </Link>
            <Link href="/" className="text-slate-500 hover:text-slate-700 transition">
              ← Back to Site
            </Link>
          </nav>
        </div>
      </header>

      {/* Side + main */}
      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Main Navigation */}
            <div className="bg-white rounded-xl border p-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                Navigation
              </div>
              <div className="space-y-1">
                <NavItem href="/admin/dashboard" icon={<LayoutDashboard size={18} />} highlight>
                  Dashboard
                </NavItem>
                <NavItem href="/admin" icon={<GaugeCircle size={18} />}>
                  Overview
                </NavItem>
                <NavItem href="/admin/properties" icon={<Building2 size={18} />}>
                  Properties
                </NavItem>
                <NavItem href="/admin/posts" icon={<FileText size={18} />}>
                  Blog Posts
                </NavItem>
                <NavItem href="/admin/landing" icon={<Home size={18} />}>
                  Landing Pages
                </NavItem>
              </div>
            </div>

            {/* Analytics & Tools */}
            <div className="bg-white rounded-xl border p-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                Analytics & Tools
              </div>
              <div className="space-y-1">
                <NavItem href="/admin/leads" icon={<Users size={18} />}>
                  Leads
                </NavItem>
                <NavItem href="/admin/analytics" icon={<LineChart size={18} />}>
                  Performance
                </NavItem>
                <NavItem href="/admin/seo" icon={<SearchCheck size={18} />}>
                  SEO Monitor
                </NavItem>
                <NavItem href="/admin/errors" icon={<AlertCircle size={18} />}>
                  Error Logs
                </NavItem>
                <NavItem href="/admin/discover" icon={<SearchCheck size={18} />}>
                  Discovery
                </NavItem>
                <NavItem href="/admin/bulk" icon={<Layers size={18} />}>
                  Bulk Operations
                </NavItem>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl border p-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                System
              </div>
              <div className="space-y-1">
                <NavItem href="/admin/settings" icon={<Settings size={18} />}>
                  Settings
                </NavItem>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-200 p-4">
              <div className="text-sm font-semibold text-primary-900 mb-2">Quick Actions</div>
              <div className="space-y-2 text-xs">
                <Link
                  href="/admin/posts/new"
                  className="block text-primary-700 hover:text-primary-900 font-medium"
                >
                  + New Blog Post
                </Link>
                <Link
                  href="/admin/calendar"
                  className="block text-primary-700 hover:text-primary-900 font-medium"
                >
                  📅 Content Calendar
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  children,
  highlight = false,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        highlight
          ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md hover:shadow-lg"
          : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
      }`}
    >
      <span className={highlight ? "text-white" : "text-slate-500 group-hover:text-primary-600"}>
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  );
}
