import { CA_CITIES } from '@/lib/seo/cities'
import { LANDINGS } from '@/lib/landing/defs'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.example.com'
  const date = new Date().toISOString()

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.5', changefreq: 'monthly' },
    { url: '/sitemap', priority: '0.4', changefreq: 'monthly' }
  ]

  const cityRoutes = CA_CITIES.flatMap(c => (
    LANDINGS.map(l => ({
      url: `/california/${c}/${l.slug}`,
      priority: l.slug === 'homes-for-sale' ? '0.8' : '0.7',
      changefreq: 'daily'
    }))
  ))

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

  for (const route of [...staticRoutes, ...cityRoutes]) {
    xml += `  <url>\n    <loc>${baseUrl}${route.url}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`
  }

  xml += '</urlset>'

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
