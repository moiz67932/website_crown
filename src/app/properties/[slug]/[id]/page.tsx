/**
 * Property Detail Page - Server-Side Rendered
 * Fully SSR with ISR revalidation for maximum SEO
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  generateBreadcrumb,
  generatePropertySchema,
  validateMetaLength,
  buildPropertySlug,
} from "@/lib/utils/seo";
import { safeBeds, safeBaths, safeCurrency, safeAcres, safeYear } from "@/lib/utils/safeField";
import PropertyDetailClient from "./property-detail-client";

// Enable ISR with 1-hour revalidation
export const revalidate = 3600;

interface PropertyDetailPageProps {
  params: Promise<{
    id: string;
    slug?: string;
  }>;
}

/**
 * Fetch property data on the server
 */
async function getPropertyServer(listingId: string) {
  const supabase = getSupabase();

  if (!supabase) {
    console.error("[property-detail] No Supabase client available");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("listing_key", listingId)
      .single();

    if (error) {
      console.error("[property-detail] Query error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[property-detail] Fetch error:", err);
    return null;
  }
}

/**
 * Generate static paths for known properties
 */
export async function generateStaticParams() {
  const supabase = getSupabase();

  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("properties")
      .select("listing_key, address")
      .eq("status", "Active")
      .not("property_type", "ilike", "land")  // Exclude Land properties
      .limit(100);

    if (!data) return [];

    return data.map((property) => ({
      id: property.listing_key,
      slug: buildPropertySlug(property.address || "property"),
    }));
  } catch {
    return [];
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyServer(id);

  if (!property) {
    return {
      title: "Property Not Found | Crown Coastal Homes",
      description: "The property you're looking for could not be found.",
    };
  }

  const address = property.address || "Property";
  const city = property.city || "";
  const price = safeCurrency(property.list_price);
  const beds = safeBeds(property.bedrooms);
  const baths = safeBaths(property.bathrooms);

  let title = `${address}, ${city} | Crown Coastal Homes`;
  let description = `${price ? price + " - " : ""}${address}, ${city}. `;

  if (beds || baths) {
    description += `${beds || ""}${beds && baths ? ", " : ""}${baths || ""}. `;
  }

  description += "View photos, details, and schedule a showing with Crown Coastal Homes.";

  title = validateMetaLength(title, "title");
  description = validateMetaLength(description, "description");

  const propertySlug = buildPropertySlug(address);
  const canonicalUrl = `/properties/${propertySlug}/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.crowncoastalhomes.com${canonicalUrl}`,
      images: property.images?.[0]
        ? [
            {
              url: property.images[0],
              width: 1200,
              height: 630,
              alt: address,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: property.images?.[0] ? [property.images[0]] : [],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

/**
 * Main Server Component
 */
export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id, slug } = await params;

  // Fetch property data on the server
  const property = await getPropertyServer(id);

  if (!property) {
    notFound();
  }

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumb([
    { name: "Home", item: "/", position: 1 },
    { name: "Properties", item: "/properties", position: 2 },
    {
      name: property.city || "City",
      item: `/properties?city=${property.city || ""}`,
      position: 3,
    },
    {
      name: property.address || "Property",
      item: `/properties/${buildPropertySlug(property.address || "property")}/${id}`,
      position: 4,
    },
  ]);

  const propertySchema = generatePropertySchema({
    listing_key: property.listing_key,
    address: property.address,
    city: property.city,
    county: property.county,
    state: property.state,
    postal_code: property.postal_code,
    list_price: property.list_price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    living_area_sqft: property.living_area_sqft,
    lot_size_sqft: property.lot_size_sqft,
    year_built: property.year_built,
    property_type: property.property_type,
    public_remarks: property.public_remarks,
    images: property.images,
    on_market_timestamp: property.on_market_timestamp,
    listing_agent_name: property.list_agent_full_name,
    listing_office_name: property.list_office_name,
  });

  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertySchema) }}
      />

      {/* SSR Content - Static HTML for SEO */}
      <div className="bg-neutral-50 dark:bg-slate-900 min-h-screen w-full pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Property Header - SSR */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {property.address}
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-2">
              {property.city}
              {property.county ? `, ${property.county}` : ""}
              {property.state ? `, ${property.state}` : ""}
              {property.postal_code ? ` ${property.postal_code}` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-lg">
              {safeCurrency(property.list_price) && (
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {safeCurrency(property.list_price)}
                </div>
              )}

              {safeBeds(property.bedrooms) && (
                <div className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold">{safeBeds(property.bedrooms)}</span>
                </div>
              )}

              {safeBaths(property.bathrooms) && (
                <div className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold">{safeBaths(property.bathrooms)}</span>
                </div>
              )}

              {safeAcres(property.living_area_sqft) && (
                <div className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold">{safeAcres(property.living_area_sqft)}</span>
                </div>
              )}
            </div>
          </header>

          {/* Property Description - SSR for SEO */}
          {property.public_remarks && (
            <section className="mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                About This Property
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300">
                {property.public_remarks}
              </div>
            </section>
          )}

          {/* Property Details Grid - SSR for SEO */}
          <section className="mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              Property Details
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.property_type && (
                <>
                  <dt className="font-semibold text-neutral-600 dark:text-neutral-400">
                    Property Type
                  </dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">
                    {property.property_type}
                  </dd>
                </>
              )}

              {safeYear(property.year_built) && (
                <>
                  <dt className="font-semibold text-neutral-600 dark:text-neutral-400">
                    Year Built
                  </dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">
                    {safeYear(property.year_built)}
                  </dd>
                </>
              )}

              {safeAcres(property.lot_size_sqft) && (
                <>
                  <dt className="font-semibold text-neutral-600 dark:text-neutral-400">
                    Lot Size
                  </dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">
                    {safeAcres(property.lot_size_sqft)}
                  </dd>
                </>
              )}

              {property.listing_key && (
                <>
                  <dt className="font-semibold text-neutral-600 dark:text-neutral-400">
                    Listing ID
                  </dt>
                  <dd className="text-neutral-900 dark:text-neutral-100 font-mono text-sm">
                    {property.listing_key}
                  </dd>
                </>
              )}
            </dl>
          </section>

          {/* Interactive Features - Client Component with Suspense */}
          <Suspense
            fallback={
              <div className="animate-pulse space-y-8">
                <div className="h-96 bg-neutral-200 dark:bg-slate-700 rounded-2xl" />
                <div className="h-12 bg-neutral-200 dark:bg-slate-700 rounded-xl" />
              </div>
            }
          >
            <PropertyDetailClient property={property} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

