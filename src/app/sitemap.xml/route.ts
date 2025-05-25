
export async function GET() {
  // Base URL - replace with your actual domain in production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://crowncoastalhomes.com"

  // Current date for lastmod
  const date = new Date().toISOString()

  // Start XML content
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  // Add static routes
  const staticRoutes = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/properties", priority: "0.9", changefreq: "daily" },
    { url: "/map", priority: "0.8", changefreq: "daily" },
    { url: "/about", priority: "0.7", changefreq: "monthly" },
    { url: "/contact", priority: "0.7", changefreq: "monthly" },
    { url: "/sitemap", priority: "0.5", changefreq: "monthly" },
  ]

  // Add static routes to XML
  staticRoutes.forEach((route) => {
    xml += `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`
  })

//   // Add dynamic property routes
//   properties.forEach((property) => {
//     xml += `  <url>
//     <loc>${baseUrl}/properties/${property.id}</loc>
//     <lastmod>${date}</lastmod>
//     <changefreq>weekly</changefreq>
//     <priority>0.8</priority>
//   </url>
// `
//   })

  // Close XML
  xml += `</urlset>`

  // Return XML with proper content type
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
