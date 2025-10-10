// src/app/admin/properties/page.tsx
import Link from "next/link";
import SyncControls from "@/components/admin/SyncControls";
import { searchProperties } from "@/lib/db/property-repo";
import PropertyRowActions from "@/components/admin/PropertyRowActions";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { getPropertyVectorSearch } from "@/lib/vector-search";

export const dynamic = "force-dynamic";

export default async function PropertiesAdmin({ searchParams }: { searchParams?: Promise<{ q?: string; city?: string; type?: string; status?: string; page?: string; limit?: string; minPrice?: string; maxPrice?: string; minBedrooms?: string; maxBedrooms?: string; minBathrooms?: string; maxBathrooms?: string; hasPool?: string; hasView?: string; keywords?: string }> }) {
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const city = (sp.city || "").trim();
  const type = (sp.type || "").trim();
  const status = (sp.status || "").trim();
  const uiPage = Math.max(1, parseInt((sp.page as any) || "1", 10) || 1);
  // UI shows 20 per page; we fetch in batches of 50 from DB to reduce heavy offsets
  const perPage = 20;
  const batchSize = 50;
  const batchIndex = Math.floor(((uiPage - 1) * perPage) / batchSize);
  const offset = batchIndex * batchSize;
  const limit = batchSize;

  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const minBedrooms = sp.minBedrooms ? Number(sp.minBedrooms) : undefined;
  const maxBedrooms = sp.maxBedrooms ? Number(sp.maxBedrooms) : undefined;
  const minBathrooms = sp.minBathrooms ? Number(sp.minBathrooms) : undefined;
  const maxBathrooms = sp.maxBathrooms ? Number(sp.maxBathrooms) : undefined;
  const hasPool = sp.hasPool === 'true' ? true : undefined;
  const hasView = sp.hasView === 'true' ? true : undefined;
  const keywordsStr = (sp.keywords || q || '').trim();
  const keywords = keywordsStr ? keywordsStr.split(/\s+/).slice(0, 6) : undefined; // cap words defensively

  // Map admin "status" filter to repo params; q will search city only for now
  const repoParams: any = {
    city: city || undefined,
    propertyType: type || undefined,
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    hasPool,
    hasView,
    keywords,
    limit,
    offset,
    sort: 'updated',
  };

  // status filter: only Active/Pending/Sold supported in repo; default behavior already filters Active
  if (status && status !== 'Active') {
    // For admin view across statuses, we'll bypass the repo's default Active-only by querying directly later if needed.
    // To keep changes small, when status is not Active, we'll still use repo and filter client-side.
  }

  const result = await searchProperties(repoParams);
  let rows = result.properties as any[];
  // If status filter is provided, filter client-side for now
  if (status) rows = rows.filter((r: any) => (r.status || '').toLowerCase() === status.toLowerCase());

  // Slice the batch into the current UI page (20 per page)
  const startIdxWithinBatch = ((uiPage - 1) * perPage) - (batchIndex * batchSize);
  const visibleRows = rows.slice(Math.max(0, startIdxWithinBatch), Math.max(0, startIdxWithinBatch) + perPage);
  const total = Number(result.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Vector index stats (read directly from server singleton to avoid URL issues)
  let stats: { totalProperties: number; vocabularySize: number } = { totalProperties: 0, vocabularySize: 0 };
  try {
    const vs = getPropertyVectorSearch().getIndexStats();
    stats = { totalProperties: vs.totalProperties ?? 0, vocabularySize: vs.vocabularySize ?? 0 };
  } catch {
    // keep defaults on error
  }

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

      {/* Filters (richer like /properties) */}
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search address, city…"
          className="w-full sm:w-80 rounded-lg border px-3 py-2"
        />
        <input name="city" defaultValue={city} placeholder="City" className="w-full rounded-lg border px-3 py-2" />
        <input name="type" defaultValue={type} placeholder="Type (Condo, House)" className="w-full rounded-lg border px-3 py-2" />
        <div className="flex gap-2">
          <input name="minPrice" defaultValue={sp.minPrice || ''} placeholder="Min Price" className="w-full rounded-lg border px-3 py-2" />
          <input name="maxPrice" defaultValue={sp.maxPrice || ''} placeholder="Max Price" className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <input name="minBedrooms" defaultValue={sp.minBedrooms || ''} placeholder="Min Beds" className="w-full rounded-lg border px-3 py-2" />
          <input name="maxBedrooms" defaultValue={sp.maxBedrooms || ''} placeholder="Max Beds" className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <input name="minBathrooms" defaultValue={sp.minBathrooms || ''} placeholder="Min Baths" className="w-full rounded-lg border px-3 py-2" />
          <input name="maxBathrooms" defaultValue={sp.maxBathrooms || ''} placeholder="Max Baths" className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasPool" value="true" defaultChecked={hasPool === true} />
            Pool
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasView" value="true" defaultChecked={hasView === true} />
            View
          </label>
        </div>
        <input name="keywords" defaultValue={keywordsStr} placeholder="Keywords (space-separated)" className="w-full rounded-lg border px-3 py-2" />
        <select name="status" defaultValue={status} className="w-full rounded-lg border px-3 py-2">
          <option value="">All status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Sold">Sold</option>
        </select>
        <input type="hidden" name="page" value={String(uiPage)} />
        <button className="rounded-lg border px-4 py-2 bg-white hover:bg-slate-50 hover:cursor-pointer">Filter</button>
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
              <Th className="w-20">Hidden</Th>
              <Th className="w-36 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(visibleRows || []).map((p: any) => (
              <tr key={p.listing_key || p.id} className="border-t hover:bg-slate-50/50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.images?.[0] || p.main_photo_url || p.main_image_url || p.hero_image_url || "/placeholder-image.jpg"}
                      alt=""
                      className="h-14 w-24 rounded-md object-cover bg-slate-100"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <Link href={`/properties/${encodeURIComponent(p.city || '')}/${encodeURIComponent(p.listing_key || '')}`} className="font-medium text-slate-900 hover:underline line-clamp-1" prefetch={false}>
                        {deriveTitle(p)}
                      </Link>
                      <div className="text-xs text-slate-500 line-clamp-1">{p.city || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 align-top">{p.city || "—"}</td>
                <td className="p-3 align-top">{p.property_type || "—"}</td>
                <td className="p-3 align-top text-right">{formatPrice(p.list_price)}</td>
                <td className="p-3 align-top">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 align-top">{p.hidden ? 'Yes' : 'No'}</td>
                <td className="p-3 align-top">
                  <div className="flex justify-end gap-2">
                    <a href={`/properties/${encodeURIComponent(p.city || '')}/${encodeURIComponent(p.listing_key || '')}`} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">View</a>
                    <PropertyRowActions id={(p as any).id} listingKey={p.listing_key} hidden={p.hidden} />
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">No properties found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Numeric pagination (20 per UI page; 50-per-fetch batches under the hood) */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing {visibleRows.length} of {total} {result.totalEstimated ? '(estimated)' : ''}
        </div>
        <Pagination>
          <PaginationContent>
            {/* Previous */}
            <PaginationItem>
              <PaginationPrevious href={`?${toQuery({ ...spAsParams(sp), page: String(Math.max(1, uiPage - 1)) })}`} />
            </PaginationItem>
            {/* Page numbers (window around current) */}
            {renderPageWindow(uiPage, totalPages, sp)}
            {/* Next */}
            <PaginationItem>
              <PaginationNext href={`?${toQuery({ ...spAsParams(sp), page: String(Math.min(totalPages, uiPage + 1)) })}`} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
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

function deriveTitle(p: any) {
  // Prefer any display_name set by API; fall back to address or listing key
  const display = (p as any).display_name || (p as any).address || (p as any).cleaned_address || '';
  if (display) return display;
  return p.listing_key || p.id || 'Property';
}

function toQuery(params: Record<string, string>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) usp.set(k, v); });
  return usp.toString();
}

function spAsParams(sp: Record<string, any>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v != null && v !== '' && k !== 'page') out[k] = String(v);
  }
  return out;
}

function renderPageWindow(current: number, totalPages: number, sp: Record<string, any>) {
  const items: any[] = [];
  const add = (pageNum: number) => {
    const href = `?${toQuery({ ...spAsParams(sp), page: String(pageNum) })}`;
    items.push(
      <PaginationItem key={pageNum}>
        <PaginationLink href={href} isActive={pageNum === current}>{pageNum}</PaginationLink>
      </PaginationItem>
    );
  };
  // window of pages: first, prev of current, current, next of current, last
  const window: number[] = [];
  const pushUnique = (n: number) => { if (n >= 1 && n <= totalPages && !window.includes(n)) window.push(n); };
  pushUnique(1);
  for (let n = current - 2; n <= current + 2; n++) pushUnique(n);
  pushUnique(totalPages);
  window.sort((a,b) => a - b);
  let last = 0;
  for (const n of window) {
    if (last && n - last > 1) {
      items.push(
        <PaginationItem key={`ellipsis-${last}-${n}`}>
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    add(n);
    last = n;
  }
  return items;
}
