// src/app/admin/properties/page.tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import SyncControls from "@/components/admin/SyncControls";

export const dynamic = "force-dynamic";

export default async function PropertiesAdmin({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; city?: string; type?: string; status?: string }>;
}) {
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const city = (sp.city || "").trim();
  const type = (sp.type || "").trim();
  const status = (sp.status || "").trim();

  const supa = getSupabase();
  if (!supa) return <div className="p-6">Supabase not configured.</div>;

  let query = supa
    .from("properties")
    .select("id,slug,title,city,price,hero_image_url,property_type,status,created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (type) query = query.ilike("property_type", `%${type}%`);
  if (status) query = query.eq("status", status);

  const { data: rows } = await query.limit(200);

  // Vector index stats
  const statsRes = await fetch(`/api/admin/vector-index`, { cache: 'no-store' });
  const statsJson = await statsRes.json().catch(() => ({}));
  const stats = statsJson?.data?.stats || { totalProperties: 0, vocabularySize: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-sm text-slate-600">Manage listings and sync with MLS.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium">Sync controls</div>
            <SyncControls />
          </div>
          <div className="text-sm grid grid-cols-2 gap-4">
            <div>
              <div className="text-slate-600">Indexed properties</div>
              <div className="font-semibold">{stats.totalProperties ?? 0}</div>
            </div>
            <div>
              <div className="text-slate-600">Vocabulary size</div>
              <div className="font-semibold">{stats.vocabularySize ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search address, city…"
          className="w-full sm:w-80 rounded-lg border px-3 py-2"
        />
        <input name="city" defaultValue={city} placeholder="City" className="w-full sm:w-48 rounded-lg border px-3 py-2" />
        <input name="type" defaultValue={type} placeholder="Type (Condo, House)" className="w-full sm:w-48 rounded-lg border px-3 py-2" />
        <select name="status" defaultValue={status} className="w-full sm:w-48 rounded-lg border px-3 py-2">
          <option value="">All status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Sold">Sold</option>
        </select>
        <button className="rounded-lg border px-4 py-2 bg-white hover:bg-slate-50">Filter</button>
      </form>

      <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-slate-600">
              <Th>Property</Th>
              <Th className="w-32">City</Th>
              <Th className="w-32">Type</Th>
              <Th className="w-28 text-right">Price</Th>
              <Th className="w-24">Status</Th>
              <Th className="w-36 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-slate-50/50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.hero_image_url || "/placeholder.jpg"}
                      alt=""
                      className="h-14 w-24 rounded-md object-cover bg-slate-100"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <Link href={`/property/${p.slug}`} className="font-medium text-slate-900 hover:underline line-clamp-1" prefetch={false}>
                        {p.title || p.slug}
                      </Link>
                      <div className="text-xs text-slate-500 line-clamp-1">{p.city || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top">{p.city || "—"}</td>
                <td className="p-3 align-top">{p.property_type || "—"}</td>
                <td className="p-3 align-top text-right">{formatPrice(p.price)}</td>
                <td className="p-3 align-top">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 align-top">
                  <div className="flex justify-end gap-2">
                    <a href={`/property/${p.slug}`} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">View</a>
                    <a href={`/admin/properties/${p.id}`} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">Edit</a>
                    <form action={`/api/admin/properties`} method="post" className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="_method" value="DELETE" />
                      <button className="rounded-lg border px-3 py-1.5 text-xs hover:bg-red-50">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">No properties found.</td>
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
    Active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    Sold: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
  const key = status || "";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[key] || "bg-slate-100"}`}>
      {status || "—"}
    </span>
  );
}

function formatPrice(n?: number | null) {
  if (!n || n <= 0) return "—";
  try { return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }); } catch { return `$${n}`; }
}
