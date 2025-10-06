"use client"
import React from "react"
import type { PropertyResultsBlock } from "@/lib/ui-spec"

export function PropertyResults({ items, querySummary, page, pageSize, nextPage, rawQuery }: PropertyResultsBlock) {
  const onMore = () => {
    try {
      const ev = new CustomEvent('cc-chat-load-more', { detail: { page: (page || 1) + 1, rawQuery } })
      window.dispatchEvent(ev)
    } catch {}
  }
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">{querySummary}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((p) => (
          <a key={p.id} href={p.url || '#'} className="group overflow-hidden rounded-xl border bg-white hover:shadow transition">
            {p.photoUrl ? (
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img src={p.photoUrl} alt={p.title || p.address || 'Property photo'} className="h-full w-full object-cover group-hover:scale-[1.02] transition" />
              </div>
            ) : null}
            <div className="p-3">
              <div className="font-semibold text-gray-900">{p.price ? `$${p.price.toLocaleString()}` : "Price on request"}</div>
              <div className="text-sm text-gray-700">{p.title || p.address}</div>
              <div className="text-xs text-gray-500">{[p.city, p.state, p.postalCode].filter(Boolean).join(", ")}</div>
              <div className="mt-1 text-xs text-gray-600">
                {[p.bedrooms ? `${p.bedrooms} bd` : null, p.bathrooms ? `${p.bathrooms} ba` : null, p.livingArea ? `${p.livingArea.toLocaleString()} sqft` : null].filter(Boolean).join(" · ")}
              </div>
            </div>
          </a>
        ))}
      </div>
      {nextPage ? (
        <div className="pt-1">
          <button type="button" onClick={onMore} className="w-full px-3 py-2 rounded-lg border bg-gray-50 text-gray-900 hover:bg-gray-100">
            Load more
          </button>
        </div>
      ) : null}
    </div>
  )
}
