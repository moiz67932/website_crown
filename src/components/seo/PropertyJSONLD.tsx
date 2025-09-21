'use client'
export default function PropertyJSONLD({ listing }: { listing: any }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": listing?.title || listing?.address,
    "url": typeof window !== "undefined" ? window.location.href : "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": listing?.address || "",
      "addressLocality": listing?.city || "",
      "addressRegion": listing?.state || "",
      "postalCode": listing?.zip_code || ""
    },
    "offers": {
      "@type": "Offer",
      "price": listing?.list_price || listing?.price || 0,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}
