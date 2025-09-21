// src/app/admin/seo/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SeoAdmin() {
  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  // Wrap RPC in try/catch since builder doesn't expose catch
  const [missingMeta, missingHero, missingIntro] = await Promise.all([
    supa.from("posts").select("id,slug,title_primary").or("meta_description.is.null,meta_description.eq.").eq("status", "published"),
    supa.from("posts").select("id,slug,title_primary").is("hero_image_url", null).eq("status", "published"),
    supa.from("landing_pages").select("id,city,slug").or("intro_html.is.null,intro_html.eq."),
  ]);
  let shortContent: any = { data: [] };
  let dupSlugs: any = { data: [] };
  try { shortContent = await supa.rpc("posts_with_short_content", { min_words: 300 }); } catch {}
  try { dupSlugs = await supa.rpc("duplicate_post_slugs"); } catch {}

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">SEO & Content Health</h1>

      <IssueCard title={`Posts missing meta description (${missingMeta.data?.length ?? 0})`}>
        <IssueTable rows={missingMeta.data || []} cols={["title_primary", "slug"]} link={(r:any)=>`/admin/posts/${r.id}`} />
      </IssueCard>

      <IssueCard title={`Posts missing hero image (${missingHero.data?.length ?? 0})`}>
        <ActionTable rows={missingHero.data || []} cols={["title_primary", "slug"]} actionLabel="Add Hero" actionPath="/api/admin/posts/add-hero" />
      </IssueCard>

      <IssueCard title={`Posts under 300 words (${shortContent.data?.length ?? 0})`}>
        <ActionTable rows={shortContent.data} cols={["title_primary", "slug", "word_count"]} actionLabel="Expand Content" actionPath="/api/admin/posts/expand" />
      </IssueCard>

      <IssueCard title={`Landing pages missing intro (${missingIntro.data?.length ?? 0})`}>
        <IssueTable rows={missingIntro.data || []} cols={["city", "slug"]} link={(r:any)=>`/admin/landing/${r.id}`} />
      </IssueCard>

      <IssueCard title={`Duplicate slugs (${dupSlugs.data?.length ?? 0})`}>
        <IssueTable rows={dupSlugs.data} cols={["slug", "count"]} link={(r:any)=>`/admin/posts/${r.id || ''}`} />
      </IssueCard>
    </div>
  );
}

function IssueCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function IssueTable({ rows, cols, link }: { rows: any[]; cols: string[]; link: (r: any) => string }) {
  if (!rows?.length) return <div className="text-sm text-slate-600">No issues found.</div>;
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/80">
          <tr className="text-left text-slate-600">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">{c.replace(/_/g, " ")}</th>
            ))}
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide w-32 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-slate-50/50">
              {cols.map((c) => (
                <td key={c} className="p-3 align-top">{String(r[c] ?? '—')}</td>
              ))}
              <td className="p-3 align-top text-right">
                <Link href={link(r)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionTable({ rows, cols, actionLabel, actionPath }: { rows: any[]; cols: string[]; actionLabel: string; actionPath: string }) {
  if (!rows?.length) return <div className="text-sm text-slate-600">No issues found.</div>;
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/80">
          <tr className="text-left text-slate-600">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">{c.replace(/_/g, " ")}</th>
            ))}
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide w-40 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-slate-50/50">
              {cols.map((c) => (
                <td key={c} className="p-3 align-top">{String(r[c] ?? '—')}</td>
              ))}
              <td className="p-3 align-top text-right">
                <form action={quickFix.bind(null, actionPath, r.id)}>
                  <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 hover:cursor-pointer">{actionLabel}</button>
                </form>
                {actionLabel === 'Add Hero' ? (
                  <form action={quickFix.bind(null, '/api/admin/posts/rewrite', r.id)} className="inline-block ml-2">
                    <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 hover:cursor-pointer">Regenerate Meta</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function quickFix(path: string, postId: string) {
  'use server'
  await fetch(path, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ postId }) })
}
