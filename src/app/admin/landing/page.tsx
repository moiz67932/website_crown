// src/app/admin/landing/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LandingAdmin({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = searchParams ? await searchParams : {} as { q?: string };
  const q = (sp.q || "").trim();

  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  let query = supa
    .from("landing_pages")
    .select("id,city,kind,page_name,ai_description_html,hero_image_url,updated_at")
    .order("updated_at", { ascending: false });

  if (q) query = query.or(`city.ilike.%${q}%,page_name.ilike.%${q}%,kind.ilike.%${q}%`);

  const { data: rows, error } = await query.limit(200);
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-2 text-red-600 font-medium">Failed to load landing pages.</div>
        <pre className="text-xs text-red-700 bg-red-50 rounded p-3 overflow-auto">{error.message}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Landing pages</h1>
          <p className="text-sm text-slate-600">Manage AI intro, FAQs, and publish status.</p>
        </div>
        <form action="/api/admin/landing/regenerate" method="post">
          <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 hover:cursor-pointer">Regenerate all</button>
        </form>
      </div>

      <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input name="q" defaultValue={q} placeholder="Search by city/page name/kind…" className="w-full sm:w-96 rounded-lg border px-3 py-2" />
  <button className="rounded-lg border px-4 py-2 bg-white hover:bg-slate-50 hover:cursor-pointer">Filter</button>
      </form>

      <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-slate-600">
              <Th>Page</Th>
              <Th className="w-32">Updated</Th>
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
                      <div className="text-xs text-slate-500 line-clamp-1">{p.kind || "—"}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{stripHtml(p.ai_description_html || '').slice(0, 120)}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top text-slate-600">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</td>
                <td className="p-3 align-top">
                  <div className="flex justify-end gap-2">
                    <a href={canonicalPath(p)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50" target="_blank" rel="noreferrer">Preview</a>
                    <a href={`/admin/landing/${p.id}`} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">Edit</a>
                    <form action="/api/admin/landing/regenerate" method="post" className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 hover:cursor-pointer">Regenerate</button>
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

function displayTitle(p: any) {
  const city = (p.city || "").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const page = (p.page_name || "").replace(/-/g, " ");
  return `${city} ${page}`.trim();
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalPath(p: any) {
  const page = encodeURIComponent(p.page_name || p.id);
  return `/landing/${page}`;
}
