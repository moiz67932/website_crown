// src/app/admin/landing/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LandingAdmin({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const status = (sp.status || "").trim();

  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  let query = supa
    .from("landing_pages")
    .select("id,city,region,slug,intro_html,hero_image_url,status,updated_at")
    .order("updated_at", { ascending: false });

  if (q) query = query.or(`city.ilike.%${q}%,region.ilike.%${q}%`);
  if (status) query = query.eq("status", status);

  const { data: rows } = await query.limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Landing pages</h1>
          <p className="text-sm text-slate-600">Manage AI intro, FAQs, and publish status.</p>
        </div>
        <form action="/api/admin/landing/regenerate" method="post">
          <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">Regenerate all</button>
        </form>
      </div>

      <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input name="q" defaultValue={q} placeholder="Search by city/region…" className="w-full sm:w-80 rounded-lg border px-3 py-2" />
        <select name="status" defaultValue={status} className="w-full sm:w-48 rounded-lg border px-3 py-2">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button className="rounded-lg border px-4 py-2 bg-white hover:bg-slate-50">Filter</button>
      </form>

      <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-slate-600">
              <Th>Page</Th>
              <Th className="w-24">Status</Th>
              <Th className="w-40 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-slate-50/50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.hero_image_url || "/placeholder.jpg"} alt="" className="h-14 w-24 rounded-md object-cover bg-slate-100" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 line-clamp-1">{displayTitle(p)}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{p.slug}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{stripHtml(p.intro_html || '').slice(0, 120)}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 align-top">
                  <div className="flex justify-end gap-2">
                    <a href={canonicalPath(p)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50" target="_blank" rel="noreferrer">Preview</a>
                    <a href={`/admin/landing/${p.id}`} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">Edit</a>
                    <form action="/api/admin/landing/regenerate" method="post" className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">Regenerate</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-500">No landing pages found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: any; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
  const key = status || "";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[key] || "bg-slate-100"}`}>
      {status || "—"}
    </span>
  );
}

function displayTitle(p: any) {
  const city = (p.city || "").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const slug = (p.slug || "").replace(/-/g, " ");
  return `${city} ${slug}`.trim();
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalPath(p: any) {
  const citySlug = (p.city || "").toLowerCase().replace(/\s+/g, "-");
  return `/california/${citySlug}/${p.slug}`;
}
