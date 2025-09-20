// src/app/admin/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";
import {
  GaugeCircle,
  Building2,
  FileText,
  Home,
  Layers,
  Settings,
  LineChart,
  SearchCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
              CC
            </span>
            <span className="font-semibold tracking-tight">Admin</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="/admin" className="hover:text-slate-700">Dashboard</Link>
            <Link href="/admin/properties" className="hover:text-slate-700">Properties</Link>
            <Link href="/admin/posts" className="hover:text-slate-700">Posts</Link>
            <Link href="/admin/landing" className="hover:text-slate-700">Landing</Link>
            <Link href="/admin/bulk" className="hover:text-slate-700">Bulk</Link>
            <Link href="/admin/analytics" className="hover:text-slate-700">Analytics</Link>
            <Link href="/admin/calendar" className="hover:text-slate-700">Calendar</Link>
          </nav>
        </div>
      </header>

      {/* Side + main */}
      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <NavItem href="/admin" icon={<GaugeCircle size={18} />}>Overview</NavItem>
            <NavItem href="/admin/properties" icon={<Building2 size={18} />}>Properties</NavItem>
            <NavItem href="/admin/posts" icon={<FileText size={18} />}>Blog posts</NavItem>
            <NavItem href="/admin/landing" icon={<Home size={18} />}>Landing pages</NavItem>
            <NavItem href="/admin/bulk" icon={<Layers size={18} />}>Bulk operations</NavItem>
            <NavItem href="/admin/analytics" icon={<LineChart size={18} />}>Performance</NavItem>
            <NavItem href="/admin/seo" icon={<SearchCheck size={18} />}>SEO monitor</NavItem>
            <div className="pt-2 border-t mt-2">
              <NavItem href="/admin/settings" icon={<Settings size={18} />}>Settings</NavItem>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white hover:shadow-sm transition"
    >
      <span className="text-slate-500 group-hover:text-slate-700">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
