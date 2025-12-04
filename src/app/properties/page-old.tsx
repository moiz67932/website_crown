/**
 * Properties Listing Page - Server-Side Rendered
 * Fully SSR with ISR revalidation for SEO optimization
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import { PropertyCard } from "@/components/property-card";
import {
  generateBreadcrumb,
  generateListingSchema,
  validateMetaLength,
  formatPriceRangeForSEO,
} from "@/lib/utils/seo";
import { Property } from "@/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import PropertiesFilterClient from "./properties-filter-client";

// Enable ISR with 1-hour revalidation
export const revalidate = 3600;

interface PropertiesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Server-side data fetching function
 */
async function getPropertiesServer(filters: {
  city?: string;
  county?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  propertyType?: string;
  status?: string;
  sortBy?: string;
  page?: string;
  limit?: string;
}) {
  const supabase = getSupabase();

  if (!supabase) {
    console.error("[properties/page] No Supabase client available");
    return { properties: [], total: 0, error: "Database not available" };
  }

  try {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "50");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("properties")
      .select("*", { count: "exact" })
      .eq("status", "Active");

    // Apply filters
    if (filters.city) {
      query = query.ilike("city", `%${filters.city}%`);
    }

    if (filters.county) {
      query = query.ilike("county", `%${filters.county}%`);
    }

    if (filters.minPrice) {
      query = query.gte("list_price", parseInt(filters.minPrice));
    }

    if (filters.maxPrice) {
      query = query.lte("list_price", parseInt(filters.maxPrice));
    }

    if (filters.beds) {
      const bedsNum = parseInt(filters.beds.replace("+", ""));
      query = query.gte("bedrooms", bedsNum);
    }

    if (filters.baths) {
      const bathsNum = parseInt(filters.baths.replace("+", ""));
      query = query.gte("bathrooms", bathsNum);
    }

    if (filters.propertyType && filters.propertyType !== "all") {
      query = query.eq("property_type", filters.propertyType);
    }

    // Apply sorting
    const sortBy = filters.sortBy || "recommended";
    switch (sortBy) {
      case "price-asc":
        query = query.order("list_price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("list_price", { ascending: false });
        break;
      case "date-desc":
      case "newest":
        query = query.order("on_market_timestamp", { ascending: false });
        break;
      case "area-desc":
        query = query.order("living_area_sqft", { ascending: false });
        break;
      default:
        query = query.order("list_price", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[properties/page] Query error:", error);
      return { properties: [], total: 0, error: error.message };
    }

    return {
      properties: (data || []) as Property[],
      total: count || 0,
      error: null,
    };
  } catch (err: any) {
    console.error("[properties/page] Fetch error:", err);
    return { properties: [], total: 0, error: err.message };
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  searchParams,
}: PropertiesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const city = params.city as string | undefined;
  const minPrice = params.minPrice as string | undefined;
  const maxPrice = params.maxPrice as string | undefined;
  const propertyType = params.propertyType as string | undefined;

  let title = "Properties for Sale in California | Crown Coastal Homes";
  let description =
    "Browse exclusive properties for sale across California with Crown Coastal Homes. Expert guidance from Reza Barghlameno (DRE 02211952).";

  // Customize based on filters
  if (city) {
    title = `Homes for Sale in ${city} | Crown Coastal Homes`;
    description = `Find your dream home in ${city}, California. Expert real estate service with Crown Coastal Homes and Reza Barghlameno.`;
  }

  if (minPrice || maxPrice) {
    const priceRange = formatPriceRangeForSEO(
      minPrice ? parseInt(minPrice) : undefined,
      maxPrice ? parseInt(maxPrice) : undefined
    );
    title = `${city ? city + " " : ""}Homes ${priceRange} | Crown Coastal Homes`;
  }

  if (propertyType && propertyType !== "all") {
    const typeLabel =
      propertyType === "Residential"
        ? "Homes"
        : propertyType === "ResidentialLease"
        ? "Rentals"
        : propertyType;
    title = `${city ? city + " " : ""}${typeLabel} for Sale | Crown Coastal Homes`;
  }

  // Enforce character limits
  title = validateMetaLength(title, "title");
  description = validateMetaLength(description, "description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: "https://www.crowncoastalhomes.com/properties",
      images: [
        {
          url: "https://www.crowncoastalhomes.com/og-properties.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: "/properties",
    },
  };
}

/**
 * Main Server Component
 */
export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const params = await searchParams;

  // Extract filters from search params
  const filters = {
    city: params.city as string | undefined,
    county: params.county as string | undefined,
    minPrice: params.minPrice as string | undefined,
    maxPrice: params.maxPrice as string | undefined,
    beds: params.beds as string | undefined,
    baths: params.baths as string | undefined,
    propertyType: params.propertyType as string | undefined,
    status: params.status as string | undefined,
    sortBy: params.sortBy as string | undefined,
    page: params.page as string | undefined,
    limit: params.limit as string | undefined,
  };

  // Fetch data on the server
  const { properties, total, error } = await getPropertiesServer(filters);

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumb([
    { name: "Home", item: "/", position: 1 },
    { name: "Properties", item: "/properties", position: 2 },
  ]);

  const listingSchema =
    properties.length > 0
      ? generateListingSchema(
          properties.slice(0, 20).map((p) => ({
            id: p.listing_key || p.id || "",
            url: `/properties/${
              p.address
                ?.replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "")
                .toLowerCase() || "property"
            }/${p.listing_key || p.id || ""}`,
            name: `${p.address || "Property"}, ${p.city || ""}`,
            price: p.list_price,
            image: p.main_image_url || p.images?.[0] || "",
            address: p.address || "",
            city: p.city || "",
            bedrooms: p.bedrooms ?? undefined,
            bathrooms: p.bathrooms ?? undefined,
            livingArea: p.living_area_sqft ?? undefined,
          }))
        )
      : null;

  // Build page title
  const pageTitle = filters.city
    ? `Homes for Sale in ${filters.city}`
    : "Properties for Sale in California";

  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {listingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }}
        />
      )}

      <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {pageTitle}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {total} {total === 1 ? "property" : "properties"} found
            </p>
          </header>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
              <p className="text-red-700 dark:text-red-400">
                Error loading properties: {error}
              </p>
            </div>
          )}

          {/* Filters - Client Component for interactivity */}
          <Suspense fallback={<FiltersSkeleton />}>
            <PropertiesFilterClient currentFilters={filters} />
          </Suspense>

          {/* Property Grid */}
          {properties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl text-neutral-600 dark:text-neutral-400 mb-2">
                No properties match your criteria.
              </p>
              <p className="text-neutral-500 dark:text-neutral-500">
                Try adjusting your filters or search in a different area.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {properties.map((property) => (
                <PropertyCard
                  key={property.listing_key || property.id}
                  property={property}
                />
              ))}
            </div>
          )}

          {/* Pagination Info */}
          {total > parseInt(filters.limit || "50") && (
            <div className="mt-12 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">
                Showing {properties.length} of {total} properties
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Skeleton for filters section
 */
function FiltersSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-8 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
