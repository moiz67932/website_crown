/**
 * Properties Listing Page - Server-Side Rendered
 * Fully SSR with ISR revalidation for maximum SEO
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import { PropertyCard } from "@/components/property-card";
import PropertiesFilterClient from "./properties-filter-client";
import { generateBreadcrumb } from "@/lib/utils/seo";

// Enable ISR with 1-hour revalidation
export const revalidate = 3600;

interface PropertiesPageProps {
  searchParams: Promise<{
    city?: string;
    county?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
    baths?: string;
    propertyType?: string;
    sortBy?: string;
    page?: string;
  }>;
}

async function getPropertiesServer(filters: {
  city?: string;
  county?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  sortBy?: string;
  page?: number;
}) {
  const supabase = getSupabase();
  const perPage = 24;
  const offset = ((filters.page || 1) - 1) * perPage;

  if (!supabase) {
    console.error("No Supabase client available");
    return { properties: [], total: 0 };
  }

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .not("property_type", "ilike", "land")  // Never show Land properties
    .range(offset, offset + perPage - 1);

  // Apply filters
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.county) {
    query = query.eq("county", filters.county);
  }
  if (filters.minPrice) {
    query = query.gte("list_price", filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte("list_price", filters.maxPrice);
  }
  if (filters.beds) {
    query = query.gte("bedrooms", filters.beds);
  }
  if (filters.baths) {
    query = query.gte("bathrooms", filters.baths);
  }
  if (filters.propertyType && filters.propertyType !== "all") {
    query = query.eq("property_type", filters.propertyType);
  }

  // Apply sorting
  const sortBy = filters.sortBy || "newest";
  switch (sortBy) {
    case "price-asc":
      query = query.order("list_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("list_price", { ascending: false });
      break;
    case "beds":
      query = query.order("bedrooms", { ascending: false });
      break;
    case "sqft":
      query = query.order("living_area_sqft", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching properties:", error);
    return { properties: [], total: 0 };
  }

  return { properties: data || [], total: count || 0 };
}

export async function generateMetadata({
  searchParams,
}: PropertiesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const { city, county, propertyType, beds, baths } = params;

  // Build dynamic title and description
  let title = "Homes for Sale";
  let description =
    "Browse available properties with Crown Coastal Homes. Find your dream home today.";

  const titleParts: string[] = [];
  if (propertyType && propertyType !== "all") {
    titleParts.push(
      propertyType
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );
  }
  if (beds) {
    titleParts.push(`${beds}+ Beds`);
  }
  if (baths) {
    titleParts.push(`${baths}+ Baths`);
  }
  if (city) {
    titleParts.push(`in ${city}`);
  } else if (county) {
    titleParts.push(`in ${county} County`);
  }

  if (titleParts.length > 0) {
    title = `${titleParts.join(" ")} | Crown Coastal Homes`;
    description = `Explore ${titleParts.join(" ").toLowerCase()} with Crown Coastal Homes. View photos, details, and schedule a showing.`;
  }

  // Validate lengths
  if (title.length > 60) {
    title = title.substring(0, 57) + "...";
  }
  if (description.length > 155) {
    description = description.substring(0, 152) + "...";
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: "https://crowncoastalhomes.com/properties",
    },
  };
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const params = await searchParams;
  const {
    city,
    county,
    minPrice,
    maxPrice,
    beds,
    baths,
    propertyType,
    sortBy,
    page,
  } = params;

  // Parse filters
  const filters = {
    city,
    county,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    beds: beds ? parseInt(beds) : undefined,
    baths: baths ? parseInt(baths) : undefined,
    propertyType,
    sortBy,
    page: page ? parseInt(page) : 1,
  };

  const { properties, total } = await getPropertiesServer(filters);

  // Generate schema
  const breadcrumbSchema = generateBreadcrumb([
    { name: "Home", item: "/", position: 1 },
    { name: "Properties", item: "/properties", position: 2 },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: properties.length,
    itemListElement: properties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateListing",
        name: property.address || "Property",
        url: `https://crowncoastalhomes.com/properties/${property.city?.toLowerCase().replace(/\s+/g, "-")}/${property.listing_key}`,
        offers: property.list_price
          ? {
              "@type": "Offer",
              price: property.list_price,
              priceCurrency: "USD",
            }
          : undefined,
      },
    })),
  };

  const totalPages = Math.ceil(total / 24);

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Browse Properties
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {total === 0
              ? "No properties found matching your criteria"
              : `Showing ${properties.length} of ${total} properties`}
          </p>
        </header>

        {/* Filters */}
        <Suspense
          fallback={
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-8 animate-pulse">
              <div className="h-12 bg-neutral-200 dark:bg-slate-700 rounded" />
            </div>
          }
        >
          <PropertiesFilterClient currentFilters={params} />
        </Suspense>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {properties.map((property) => (
              <PropertyCard key={property.listing_key} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">
              No properties found matching your criteria
            </p>
            <p className="text-neutral-500 dark:text-neutral-500">
              Try adjusting your filters to see more results
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <a
                  key={pageNum}
                  href={`?${new URLSearchParams({
                    ...params,
                    page: pageNum.toString(),
                  }).toString()}`}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pageNum === filters.page
                      ? "bg-primary-500 text-white"
                      : "bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700"
                  }`}
                  aria-current={pageNum === filters.page ? "page" : undefined}
                >
                  {pageNum}
                </a>
              )
            )}
          </nav>
        )}
      </div>
    </>
  );
}
