/**
 * SEO utility functions for Crown Coastal Homes
 * Provides canonical URL generation, meta validation, and schema helpers
 */

interface BreadcrumbItem {
  name: string;
  item: string;
  position: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ListingItem {
  id: string;
  url: string;
  name: string;
  price?: number;
  image?: string;
  address?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
}

/**
 * Build canonical URL for landing pages
 * Format: /[state]/[city]/[slug]
 */
export function buildCanonical(
  state: string,
  city: string,
  slug: string
): string {
  const stateSlug = state.toLowerCase().replace(/\s+/g, "-");
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");
  const pageSlug = slug.toLowerCase().replace(/\s+/g, "-");

  return `/${stateSlug}/${citySlug}/${pageSlug}`;
}

/**
 * Build canonical URL for property detail pages
 * Format: /properties/[address-slug]/[listingKey]
 */
export function buildPropertyCanonical(
  address: string,
  listingKey: string
): string {
  const addressSlug = address
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  return `/properties/${addressSlug}/${listingKey}`;
}

/**
 * Validate and truncate meta text to character limits
 */
export function validateMetaLength(
  text: string,
  type: "title" | "description"
): string {
  const maxLength = type === "title" ? 60 : 155;

  if (text.length <= maxLength) {
    return text;
  }

  // Truncate and add ellipsis
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumb(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: `https://www.crowncoastalhomes.com${item.item}`,
    })),
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: FAQItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate ItemList schema for property listings
 */
export function generateListingSchema(listings: ListingItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listings.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateListing",
        "@id": `https://www.crowncoastalhomes.com${listing.url}`,
        url: `https://www.crowncoastalhomes.com${listing.url}`,
        name: listing.name,
        ...(listing.price && {
          offers: {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: "USD",
          },
        }),
        ...(listing.image && { image: listing.image }),
        ...(listing.address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: listing.address,
            addressLocality: listing.city,
            addressCountry: "US",
          },
        }),
        ...(listing.bedrooms && { numberOfRooms: listing.bedrooms }),
        ...(listing.livingArea && {
          floorSize: {
            "@type": "QuantitativeValue",
            value: listing.livingArea,
            unitCode: "FTK",
          },
        }),
      },
    })),
  };
}

/**
 * Generate RealEstateListing schema for property detail pages
 */
export function generatePropertySchema(property: {
  listing_key: string;
  address: string;
  city: string;
  county?: string;
  state?: string;
  postal_code?: string;
  list_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  living_area_sqft?: number;
  lot_size_sqft?: number;
  year_built?: number;
  property_type?: string;
  public_remarks?: string;
  images?: string[];
  on_market_timestamp?: string;
  listing_agent_name?: string;
  listing_office_name?: string;
}): object {
  const siteUrl = "https://www.crowncoastalhomes.com";
  const addressSlug = property.address
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${property.address}, ${property.city}`,
    description: property.public_remarks,
    ...(property.images &&
      property.images.length > 0 && {
        image: property.images.map((img) =>
          img.startsWith("http") ? img : `${siteUrl}${img}`
        ),
      }),
    url: `${siteUrl}/properties/${addressSlug}/${property.listing_key}`,
    ...(property.on_market_timestamp && {
      datePosted: property.on_market_timestamp,
    }),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address.split(",")[0]?.trim(),
      addressLocality: property.city,
      ...(property.county && { addressRegion: property.county }),
      ...(property.postal_code && { postalCode: property.postal_code }),
      addressCountry: "US",
    },
    ...(property.bedrooms && { numberOfRooms: property.bedrooms }),
    ...(property.living_area_sqft && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.living_area_sqft,
        unitCode: "FTK",
      },
    }),
    ...(property.year_built && { yearBuilt: property.year_built }),
    ...(property.list_price && {
      offers: {
        "@type": "Offer",
        price: property.list_price,
        priceCurrency: "USD",
      },
    }),
    ...(property.listing_agent_name && {
      realEstateAgent: {
        "@type": "RealEstateAgent",
        name: property.listing_agent_name,
        ...(property.listing_office_name && {
          worksFor: {
            "@type": "Organization",
            name: property.listing_office_name,
          },
        }),
      },
    }),
  };
}

/**
 * Generate LocalBusiness schema for Crown Coastal Homes
 */
export function generateLocalBusinessSchema(city?: string, region?: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Crown Coastal Homes",
    description:
      "Premium real estate services in California. Expert agents helping buyers and sellers achieve their real estate goals.",
    url: "https://www.crowncoastalhomes.com",
    telephone: "+1-XXX-XXX-XXXX", // Replace with actual phone
    email: "contact@crowncoastalhomes.com",
    ...(city &&
      region && {
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressRegion: region,
          addressCountry: "US",
        },
      }),
    sameAs: [
      "https://www.facebook.com/crowncoastalhomes",
      "https://www.instagram.com/crowncoastalhomes",
      "https://www.linkedin.com/company/crowncoastalhomes",
    ],
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(
  url: string,
  name: string,
  description: string
): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: `https://www.crowncoastalhomes.com${url}`,
    name,
    description,
  };
}

/**
 * Format price for display (with $1M+ formatting)
 */
export function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = (price / 1000000).toFixed(2);
    return `$${millions}M`;
  }
  if (price >= 1000) {
    const thousands = Math.floor(price / 1000);
    return `$${thousands}K`;
  }
  return `$${price.toLocaleString()}`;
}

/**
 * Format price range for SEO (e.g., "$1M+" instead of "1m")
 */
export function formatPriceRangeForSEO(min?: number, max?: number): string {
  if (!min && !max) return "";

  if (min && min >= 1000000 && !max) {
    return "$1M+";
  }

  if (min && max) {
    return `$${formatPrice(min)} - ${formatPrice(max)}`;
  }

  if (min) {
    return `$${formatPrice(min)}+`;
  }

  if (max) {
    return `Up to ${formatPrice(max)}`;
  }

  return "";
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build property URL slug from address
 */
export function buildPropertySlug(address: string): string {
  return slugify(address);
}

/**
 * Extract city and state from full address
 */
export function parseAddress(fullAddress: string): {
  street: string;
  city: string;
  state: string;
  zip: string;
} {
  const parts = fullAddress.split(",").map((p) => p.trim());

  return {
    street: parts[0] || "",
    city: parts[1] || "",
    state: parts[2]?.split(" ")[0] || "",
    zip: parts[2]?.split(" ")[1] || "",
  };
}
