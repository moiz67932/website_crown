// src/app/admin/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { ArrowUpRight, FilePlus2, RefreshCw, Server, Database } from "lucide-react";
import SyncControls from "../../components/admin/SyncControls";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  // KPIs
  const [{ count: total }, { count: published }, { count: drafts }, { count: totalProperties }, { count: subs }] = await Promise.all([
    supa.from("posts").select("id", { count: "exact", head: true }),
    supa.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supa.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supa.from("properties").select("id", { count: "exact", head: true }),
    supa.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
  ]);

  // Views last 7 days
  const { data: last7 } = await supa
    .from("page_views")
    .select("id")
    .gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  const views7 = last7?.length ?? 0;

  // Simple SEO monitors
  const [{ data: missingMeta }, { data: missingHero }, { data: missingLandingIntro } ] = await Promise.all([
    supa.from("posts").select("id").or("meta_description.is.null,meta_description.eq.").eq("status", "published"),
    supa.from("posts").select("id").is("hero_image_url", null).eq("status", "published"),
    supa.from("landing_pages").select("id").or("intro_html.is.null,intro_html.eq."),
  ]);

  return (
    <div className="space-y-8">
      {/* Heading + quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content dashboard</h1>
          <p className="text-sm text-slate-600">Manage blogs, landing pages, and monitor performance.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi title="Posts" value={total ?? 0} />
        <Kpi title="Published" value={published ?? 0} />
        <Kpi title="Drafts" value={drafts ?? 0} />
        <Kpi title="Properties" value={totalProperties ?? 0} />
        <Kpi title="Subscribers" value={subs ?? 0} />
      </div>

      {/* Health / tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Content health">
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
              <span className="text-slate-600">Landing pages missing intro</span>
              <span className="font-semibold">{missingLandingIntro?.length ?? 0}</span>
            </li>
          </ul>
        </Card>

        <Card title="Sync & vector index">
          <div className="flex items-center gap-3 text-sm">
            <Server className="text-slate-500" size={18} />
            <span>MLS sync controls</span>
          </div>
          <div className="mt-3">
            <SyncControls />
          </div>
          <div className="mt-4 text-sm text-slate-600">Views in last 7 days: <b className="text-slate-900">{views7}</b></div>
        </Card>

        <Card title="Quick links">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Quick href="/admin/properties">Properties</Quick>
            <Quick href="/admin/landing">Landing pages</Quick>
            <Quick href="/admin/bulk">Bulk ops</Quick>
            <Quick href="/admin/seo">SEO monitor</Quick>
          </div>
        </Card>
      </div>

      {/* CTR mini */}
      <Card title="Data health">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Database size={18} className="text-slate-500" />
          Track vector index and sync status from the panels above.
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
