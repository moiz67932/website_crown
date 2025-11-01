"use client"
import { useEffect, useState } from "react"
import { PropertyCard } from "./property-card"
import type { Property } from "../interfaces"
import { deriveDisplayName } from "../lib/display-name"

function parseCityState(address?: string): { city?: string; state?: string } {
  if (!address) return {}
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const city = parts[parts.length - 2]
    const last = parts[parts.length - 1]
    const state = (last.split(/\s+/)[0] || "").toUpperCase()
    return { city, state }
  }
  return {}
}

// ✅ Now async so we can fetch from DB
export function PropertyCards({ items }: { items: any[] }) {
  const [enriched, setEnriched] = useState<Property[] | null>(null)

  useEffect(() => {
    let mounted = true
    async function enrich() {
      try {
        const out = await Promise.all(
          items.map(async (it) => {
            const listingKey = String(it.listing_key ?? it.id ?? "")
            let dbRow: any = null
            if (listingKey) {
              try {
                const res = await fetch(`/api/properties/${encodeURIComponent(listingKey)}`)
                if (res.ok) {
                  const json = await res.json()
                  if (json && json.success && json.data) dbRow = json.data
                }
              } catch (e) {
                console.error("DB lookup failed for", listingKey, e)
              }
            }

            // Prefer DB row fields first (ensure we also use API's computed `address`)
            const rawAddress =
              dbRow?.unparsed_address ||
              dbRow?.formatted_address ||
              dbRow?.street_address ||
              dbRow?.full_address ||
              dbRow?.address ||
              (dbRow as any)?.display_name ||
              it.unparsed_address ||
              it.formatted_address ||
              it.full_address ||
              it.street_address ||
              it.property_address ||
              it.display_address ||
              it.address ||
              it.title ||
              ""

            const { city, state } = parseCityState(rawAddress)

            const list_price =
              typeof it.price === "number"
                ? it.price
                : Number(String(it.price ?? "").replace(/[^0-9]/g, "")) || 0

            const livingArea =
              it.living_area_sqft ??
              it.livingAreaSqft ??
              it.size_sqft ??
              it.sqft ??
              it.building_area_total ??
              it.total_livable_area ??
              it.gla ??
              it.above_grade_finished_area ??
              0

            const display_name =
              rawAddress ||
              deriveDisplayName({
                address: it.address,
                city,
                state,
                title: it.title,
                seo_title: it.seo_title,
                listing_key: listingKey,
              })

            const property = {
              id: listingKey,
              _id: listingKey,
              listing_key: listingKey,
              address: rawAddress || display_name || "",
              location: "",
              property_type:
                list_price && list_price < 10000 ? "ResidentialLease" : "Residential",
              list_price,
              bedrooms: Number(it.beds ?? 0),
              bathrooms: Number(it.baths ?? 0),
              living_area_sqft: Number(livingArea ?? 0) || (livingArea ?? ""),
              lot_size_sqft:
                Number(it.lot_size_sqft ?? 0) || (it.lot_size_sqft ?? ""),
              status: "Active",
              statusColor: "green",
              publicRemarks: "",
              favorite: false,
              image: it.image || "",
              images: it.image ? [it.image] : [],
              main_image_url: (it as any).main_photo_url || it.image,
              photo_url: undefined,
              listing_photos: undefined,
              photosCount: undefined,
              city: dbRow?.city || city || "",
              state: dbRow?.state || state || "",
              county: dbRow?.county || "",
              zip_code: dbRow?.zip_code || "",
              latitude: 0 as any,
              longitude: 0 as any,
              createdAt: "",
              updatedAt: "",
            } as any

            // Provide an explicit display_name for the card heading
            property.display_name = display_name

            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.debug("PropertyCards item map:", {
                id: property.listing_key,
                rawAddress,
                title: display_name,
                address: property.address,
                living_area_sqft: property.living_area_sqft,
                bedrooms: property.bedrooms,
              })
            }

            return property as Property
          })
        )
        if (mounted) setEnriched(out)
      } catch (e) {
        // If fetches fail, still try to render basic items
        if (mounted) {
          const fallback = items.map((it) => {
            const listingKey = String(it.id ?? it.listing_key ?? "")
            const rawAddress = it.unparsed_address || it.formatted_address || it.address || it.title || ""
            const { city, state } = parseCityState(rawAddress)
            const list_price = typeof it.price === "number" ? it.price : Number(String(it.price ?? "").replace(/[^0-9]/g, "")) || 0
            const livingArea = it.living_area_sqft ?? it.sqft ?? 0
            const display_name = rawAddress || deriveDisplayName({ address: it.address, city, state, title: it.title, seo_title: it.seo_title, listing_key: listingKey })
            const obj = {
              id: listingKey,
              _id: listingKey,
              listing_key: listingKey,
              address: rawAddress || display_name || "",
              location: "",
              property_type: list_price && list_price < 10000 ? "ResidentialLease" : "Residential",
              list_price,
              bedrooms: Number(it.beds ?? 0),
              bathrooms: Number(it.baths ?? 0),
              living_area_sqft: Number(livingArea ?? 0) || (livingArea ?? ""),
              lot_size_sqft: Number(it.lot_size_sqft ?? 0) || (it.lot_size_sqft ?? ""),
              status: "Active",
              statusColor: "green",
              publicRemarks: "",
              favorite: false,
              image: it.image || "",
              images: it.image ? [it.image] : [],
              main_image_url: (it as any).main_photo_url || it.image,
              photo_url: undefined,
              listing_photos: undefined,
              photosCount: undefined,
              city: city || "",
              state: state || "",
              county: "",
              zip_code: "",
              latitude: 0 as any,
              longitude: 0 as any,
              createdAt: "",
              updatedAt: "",
            } as any
            obj.display_name = display_name
            return obj as Property
          })
          setEnriched(fallback)
        }
      }
    }
    enrich()
    return () => { mounted = false }
  }, [items])

  const list = enriched || items.map((it) => ({
    id: String(it.listing_key ?? it.id ?? ""),
    listing_key: String(it.listing_key ?? it.id ?? ""),
    address: it.unparsed_address || it.formatted_address || it.address || it.title || "",
    image: it.image || "",
    list_price: typeof it.price === "number" ? it.price : Number(String(it.price ?? "").replace(/[^0-9]/g, "")) || 0,
    bedrooms: Number(it.beds ?? 0),
    bathrooms: Number(it.baths ?? 0),
    living_area_sqft: Number(it.living_area_sqft ?? it.sqft ?? 0),
  } as any))

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((property: any) => (
        <PropertyCard
          key={property.listing_key || property.id}
          property={property}
          showCompareButton={false}
          showBaths={false}
          showLivingArea={true}
        />
      ))}
    </div>
  )
}

/*
Test checklist (PropertyCards):
- Titles now come from DB (unparsed_address / formatted_address) via listing_key.
- Shows "547 Alden Road RV8" instead of "Big Bear Lake".
- Falls back to raw payload or deriveDisplayName if DB row missing.
- Sqft still normalizes across multiple fields.
*/
