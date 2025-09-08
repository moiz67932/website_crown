import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.example.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*?*',        // filtered parameter variants
          '/api',        // API endpoints
          '/admin',      // admin area
          '/login',
          '/signup',
          '/forgot-password'
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  }
}
