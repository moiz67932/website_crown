// import { retrieve } from "./rag"
// import { deriveDisplayName } from "./display-name"
// import { createClient } from "@supabase/supabase-js"

// function admin() {
//   return createClient(
//     process.env.SUPABASE_URL!,
//     (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
//     { auth: { persistSession: false } }
//   )
// }

// export async function toolSearchProperties(entities: any) {
//   const f = { city: entities.city, beds: entities.beds, priceMin: entities.price_min, priceMax: entities.price_max }
//   const res = await retrieve(`${entities.beds || ""} beds under ${entities.price_max || ""} in ${entities.city || ""}`, f, 12)
//   const toSlug = (s?: string) => (s || "")
//     .toLowerCase()
//     .replace(/[^a-z0-9\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-")
//     .replace(/^-|-$/g, "")

//   return res.slice(0, 6).map(({ meta, score }) => {
//     const id = meta.id || meta.listing_key || meta.listingId || meta.mlsid || meta.mls_id || meta.key
//     const price = meta.price ?? meta.list_price ?? meta.asking_price ?? meta.listPrice
//     const beds = meta.beds ?? meta.bedrooms ?? meta.num_beds
//     const baths = meta.baths ?? meta.bathrooms ?? meta.num_baths
//     const living_area_sqft = meta.living_area_sqft ?? meta.living_area ?? meta.size_sqft ?? meta.sqft
//     const sqft = living_area_sqft
//     const image = meta.image_url || meta.hero_image_url || meta.main_image_url || meta.primary_image_url || meta.image
//     const displayName = deriveDisplayName({
//       address: meta.address,
//       city: meta.city,
//       state: meta.state || meta.region,
//       title: meta.title,
//       seo_title: meta.seo_title,
//       h1_heading: meta.h1_heading,
//       listing_key: String(id || ''),
//     })
//     const title = displayName
//     const address = meta.address || meta.formatted_address || meta.addr || displayName
//     const slug = meta.slug || toSlug(address)
//     const url = slug && id ? `/properties/${slug}/${id}` : (id ? `/properties/${id}` : `/properties`)
//     return {
//       id,
//       title,
//       address,
//       price,
//       beds,
//       baths,
//       sqft,
//       living_area_sqft,
//       city: meta.city,
//       state: meta.state || meta.region,
//       image,
//       url,
//       score,
//     }
//   })
// }

// export function mortgageMonthly(P: number, annualRate: number, years: number) {
//   const r = annualRate / 12 / 100
//   const n = years * 12
//   return r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
// }

// export function mortgageBreakdown(params: {
//   price: number
//   rate: number
//   years: number
//   down_payment?: number
//   property_tax_annual?: number
//   home_insurance_annual?: number
//   hoa?: number
//   pmi_monthly?: number
// }) {
//   const down = params.down_payment ?? 0
//   const principal = Math.max(0, params.price - down)
//   const pi = mortgageMonthly(principal, params.rate, params.years)
//   const tax = (params.property_tax_annual ?? 0) / 12
//   const ins = (params.home_insurance_annual ?? 0) / 12
//   const hoa = params.hoa ?? 0
//   const pmi = params.pmi_monthly ?? 0
//   const total = pi + tax + ins + hoa + pmi
//   return {
//     principal,
//     pi: Math.round(pi),
//     tax: Math.round(tax),
//     ins: Math.round(ins),
//     hoa: Math.round(hoa),
//     pmi: Math.round(pmi),
//     total: Math.round(total),
//   }
// }

// export async function toolScheduleViewing(payload: { property_id: string; when: string; name: string; email: string; phone?: string }) {
//   const { data, error } = await admin()
//     .from("appointments")
//     .insert({
//       property_id: payload.property_id,
//       when: payload.when,
//       name: payload.name,
//       email: payload.email,
//       phone: payload.phone,
//       status: "requested",
//     })
//     .select()
//     .single()
//   if (error) throw error
//   return data
// }

// export async function toolCreateLeadDB(payload: { name: string; email: string; phone?: string; source?: string; message?: string; meta?: any }) {
//   const { data, error } = await admin()
//     .from("leads")
//     .insert({
//       name: payload.name,
//       email: payload.email,
//       phone: payload.phone,
//       source: payload.source || "chat",
//       meta: payload.meta || {},
//     })
//     .select()
//     .single()
//   if (error) throw error
//   return data
// }



// lib/tools.ts
import { retrieve } from "./rag"
import { supaServer } from '@/lib/supabase'

function admin() { return supaServer() }

export async function toolSearchProperties(entities: any) {
  const f = {
    city: entities.city,
    beds: entities.beds,
    priceMin: entities.price_min,
    priceMax: entities.price_max,
  }

  // ✅ retrieve only takes (query, scope, filter?)
  const res = await retrieve(
    `${entities.beds || ""} beds under ${entities.price_max || ""} in ${
      entities.city || ""
    }`,
    // "properties",
    f, // pass the filter here, not a 4th argument,
    12
  )

  return res.slice(0, 6).map(({ meta, score }) => {
    const id =
      meta.id ||
      meta.listing_key ||
      meta.listingId ||
      meta.mlsid ||
      meta.mls_id ||
      meta.key

    const price =
      meta.price ??
      meta.list_price ??
      meta.asking_price ??
      meta.listPrice

    const beds =
      meta.beds ?? meta.bedrooms ?? meta.num_beds ?? meta.bed_rooms

    const baths =
      meta.baths ?? meta.bathrooms ?? meta.num_baths ?? meta.bath_rooms

    // ---- living area normalization ----
    const normalizeNum = (v: any): number | undefined => {
      if (v == null) return undefined
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v)
      const s = String(v).replace(/[^\d.]/g, "")
      return s ? Math.round(parseFloat(s)) : undefined
    }

    const living_area_sqft = normalizeNum(
      meta.living_area_sqft ??
        meta.living_area ??
        meta.livingArea ??
        meta.size_sqft ??
        meta.sqft ??
        meta.building_area_total ??
        meta.total_livable_area ??
        meta.gla ?? // gross living area
        meta.above_grade_finished_area ??
        meta.buildingAreaTotal
    )

    const sqft = living_area_sqft

    // ---- image selection ----
    const image =
      meta.image_url ||
      meta.hero_image_url ||
      meta.main_image_url ||
      meta.primary_image_url ||
      meta.image ||
      (meta.images && Array.isArray(meta.images)
        ? meta.images[0]
        : undefined)

    // ---- address/title derivation ----
    const line1 =
      meta.address ||
      meta.formatted_address ||
      meta.unparsed_address ||
      [meta.street_number, meta.street_name].filter(Boolean).join(" ") ||
      meta.addr

    const city = meta.city || meta.city_name || meta.locality
    const state = meta.state || meta.state_code || meta.region || meta.province
    const addressLine = [line1, city, state].filter(Boolean).join(", ")

    const displayName =
      meta.title ||
      meta.seo_title ||
      meta.h1_heading ||
      addressLine ||
      `Property ${id || ""}`.trim()

    const title = displayName
    const address = addressLine || displayName

    const toSlug = (s?: string) =>
      (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

    const slug = meta.slug || toSlug(address)
    const url =
      slug && id
        ? `/properties/${slug}/${id}`
        : id
        ? `/properties/${id}`
        : `/properties`

    return {
      id,
      listing_key: id,
      title,
      address,
      price,
      beds,
      baths,
      sqft,
      living_area_sqft,
      city,
      state,
      image,
      url,
      score,
    }
  })
}

export function mortgageMonthly(P: number, annualRate: number, years: number) {
  const r = annualRate / 12 / 100
  const n = years * 12
  return r === 0
    ? P / n
    : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function mortgageBreakdown(params: {
  price: number
  rate: number
  years: number
  down_payment?: number
  property_tax_annual?: number
  home_insurance_annual?: number
  hoa?: number
  pmi_monthly?: number
}) {
  const down = params.down_payment ?? 0
  const principal = Math.max(0, params.price - down)
  const pi = mortgageMonthly(principal, params.rate, params.years)
  const tax = (params.property_tax_annual ?? 0) / 12
  const ins = (params.home_insurance_annual ?? 0) / 12
  const hoa = params.hoa ?? 0
  const pmi = params.pmi_monthly ?? 0
  const total = pi + tax + ins + hoa + pmi
  return {
    principal,
    pi: Math.round(pi),
    tax: Math.round(tax),
    ins: Math.round(ins),
    hoa: Math.round(hoa),
    pmi: Math.round(pmi),
    total: Math.round(total),
  }
}

export async function toolScheduleViewing(payload: {
  property_id: string
  when: string
  name: string
  email: string
  phone?: string
}) {
  const { data, error } = await admin()
    .from("appointments")
    .insert({
      property_id: payload.property_id,
      when: payload.when,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      status: "requested",
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toolCreateLeadDB(payload: {
  name: string
  email: string
  phone?: string
  source?: string
  message?: string
  meta?: any
}) {
  const { data, error } = await admin()
    .from("leads")
    .insert({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      source: payload.source || "chat",
      meta: payload.meta || {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}
