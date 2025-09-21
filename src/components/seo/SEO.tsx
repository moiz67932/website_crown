'use client'
import { NextSeo } from 'next-seo'
export default function SEO({ title, description }: { title?: string; description?: string }) {
  return <NextSeo title={title} description={description} />
}
