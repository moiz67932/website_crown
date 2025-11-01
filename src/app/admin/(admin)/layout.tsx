// import { redirect } from 'next/navigation'
// import { cookies } from 'next/headers'
// import { AuthService } from '@/lib/auth'

// export default async function AdminLayout({ children }: { children: React.ReactNode }) {
//   // Server component guard: verify token cookie and isAdmin
//   const cookieStore = await cookies()
//   const token = cookieStore.get('auth-token')?.value
//   let isAdmin = false
//   if (token) {
//     const decoded = AuthService.verifyToken(token)
//     isAdmin = !!(decoded && (decoded as any).isAdmin)
//   }
//   if (!isAdmin) {
//     redirect('/auth/login?next=/admin')
//   }
//   return <>{children}</>
// }






// src/app/admin/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { ArrowUpRight, FilePlus2, RefreshCw, Server, Database } from "lucide-react";
import SyncControls from "../../../components/admin/SyncControls";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  // KPIs
  const [{ count: total }, { count: published }, { count: drafts }] = await Promise.all([
    supa.from("posts").select("id", { count: "exact", head: true }),
    supa.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supa.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);

  // Views last 7 days
  const { data: last7 } = await supa
    .from("page_views")
    .select("id")
    .gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  const views7 = last7?.length ?? 0;

  // Global CTR across variants
  const { data: variants } = await supa
    .from("post_title_variants")
    .select("impressions,clicks");
  const imp = (variants || []).reduce((s, v: any) => s + (v.impressions ?? 0), 0);
  const clk = (variants || []).reduce((s, v: any) => s + (v.clicks ?? 0), 0);
  const ctr = imp ? (100 * clk) / imp : 0;

  // Simple SEO monitors
  const [{ data: missingMeta }, { data: missingHero }] = await Promise.all([
    supa.from("posts").select("id").or("meta_description.is.null,meta_description.eq.").eq("status", "published"),
    supa.from("posts").select("id").is("hero_image_url", null).eq("status", "published"),
  ]);

  return (
    <div className="space-y-8">
      {/* Heading + quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content dashboard</h1>
          <p className="text-sm text-slate-600">Manage blogs, landings, and monitor performance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/posts/new" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">
            <FilePlus2 size={16} /> New post
          </Link>
          <Link href="/admin/posts" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-white hover:shadow-sm">
            Browse posts <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Posts (total)" value={total ?? 0} />
        <Kpi title="Published" value={published ?? 0} />
        <Kpi title="Drafts" value={drafts ?? 0} />
        <Kpi title="Views (7 days)" value={views7} />
      </div>

      {/* Health / tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Content quality monitors">
          <ul className="text-sm space-y-2">
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Missing meta description</span>
              <span className="font-semibold">{missingMeta?.length ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Posts without hero image</span>
              <span className="font-semibold">{missingHero?.length ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Title CTR (all variants)</span>
              <span className="font-semibold">{ctr.toFixed(1)}%</span>
            </li>
          </ul>
        </Card>

        <Card title="Data & indexing">
          <div className="flex items-center gap-3 text-sm">
            <Server className="text-slate-500" size={18} />
            <span>MLS sync & health</span>
          </div>
          <div className="mt-3">
            <SyncControls />
          </div>
        </Card>

        <Card title="Quick links">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Quick href="/admin/discover">Landing pages</Quick>
            <Quick href="/admin/analytics">Analytics</Quick>
            <Quick href="/admin/discover">Bulk ops</Quick>
            <Quick href="/admin/seo">SEO monitor</Quick>
          </div>
        </Card>
      </div>

      {/* CTR mini */}
      <Card title="Title performance">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Database size={18} className="text-slate-500" />
          Aggregated from <b className="text-slate-900">{imp}</b> impressions /{" "}
          <b className="text-slate-900">{clk}</b> clicks.
        </div>
      </Card>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <RefreshCw size={16} className="text-slate-400" />
      </div>
      {children}
    </section>
  );
}

function Quick({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-white px-3 py-2 hover:shadow-sm hover:bg-slate-50 text-center"
    >
      {children}
    </Link>
  );
}
