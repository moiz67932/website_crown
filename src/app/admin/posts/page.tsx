// src/app/admin/posts/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import PostActions from "@/components/admin/PostActions";
import ReviewerCell from "@/components/admin/ReviewerCell";

export const dynamic = "force-dynamic";

export default async function PostsAdmin({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const sp = searchParams ? await searchParams : ({} as { q?: string; status?: string });
  const q = (sp.q || "").trim();
  const status = (sp.status || "").trim();

  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  // Base fetch
  let query = supa
    .from("posts")
  .select("id,slug,title_primary,city,status,hero_image_url,published_at,created_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("title_primary", `%${q}%`);

  const { data: posts, error } = await query.limit(200);
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-2 text-red-600 font-medium">Failed to load posts.</div>
        <pre className="text-xs text-red-700 bg-red-50 rounded p-3 overflow-auto">{error.message}</pre>
      </div>
    );
  }

  // Views last 30 days
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: views } = await supa
    .from("page_views")
    .select("post_id")
    .gte("created_at", since);

  const viewsMap = new Map<string, number>();
  (views || []).forEach((v: any) => {
    viewsMap.set(v.post_id, (viewsMap.get(v.post_id) || 0) + 1);
  });

  // CTR from variants
  const { data: vars } = await supa.from("post_title_variants").select("post_id,impressions,clicks");
  const ctrMap = new Map<string, { i: number; c: number }>();
  (vars || []).forEach((r: any) => {
    const cur = ctrMap.get(r.post_id) || { i: 0, c: 0 };
    cur.i += r.impressions ?? 0;
    cur.c += r.clicks ?? 0;
    ctrMap.set(r.post_id, cur);
  });

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog posts</h1>
          <p className="text-sm text-slate-600">Search, filter, publish and monitor performance.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
        >
          + New post
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search titles…"
          className="w-full sm:w-80 rounded-lg border px-3 py-2"
        />
        <select name="status" defaultValue={status} className="w-full sm:w-48 rounded-lg border px-3 py-2">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
  <button className="rounded-lg border px-4 py-2 bg-white hover:bg-slate-50 hover:cursor-pointer">Filter</button>
      </form>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-slate-600">
              <Th>Post</Th>
              <Th className="w-24">Status</Th>
              <Th className="w-32">Published</Th>
              <Th className="w-24 text-right">Views (30d)</Th>
              <Th className="w-24 text-right">CTR</Th>
              <Th className="w-40 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(posts || []).map((p) => {
              const v = viewsMap.get(p.id) || 0;
              const ctr = ctrMap.get(p.id);
              const ctrPct = ctr && ctr.i ? (100 * ctr.c) / ctr.i : 0;
              return (
                <tr key={p.id} className="border-t hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.hero_image_url || "/images/placeholder-16x9.png"}
                        alt=""
                        className="h-14 w-24 rounded-md object-cover bg-slate-100"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/blog/${p.slug}`}
                          className="font-medium text-slate-900 hover:underline line-clamp-1"
                        >
                          {p.title_primary}
                        </Link>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {p.city?.replace(/-/g, " ") || "—"} • <code className="text-slate-400">{p.slug}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-3 align-top text-slate-600">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 align-top text-right">{v}</td>
                  <td className="p-3 align-top text-right">{ctrPct.toFixed(1)}%</td>
                  <td className="p-3 align-top">
                    <div className="flex justify-end">
                      <PostActions id={p.id} slug={p.slug} status={p.status} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!posts?.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No posts found.
                </td>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    scheduled: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
}
