// import React from 'react'

// interface Props { html?: string }

// export default function AIDescription({ html }: Props) {
//   if (!html) return null
//   return (
//     <section className="prose dark:prose-invert max-w-none">
//       <h2 className="text-xl font-semibold mb-2">About This City</h2>
//       <div dangerouslySetInnerHTML={{ __html: html }} />
//     </section>
//   )
// }


// src/app/(landing)/sections/AIDescription.tsx
import React from 'react'
import Image from 'next/image'
import { getLandingInlineImages } from '../../../lib/landing/image' // same file where getLandingHeroImage lives

type Props = {
  city: string
  kind: string
  html?: string
}

/**
 * Split the HTML into paragraph-sized chunks so we can interleave images.
 * We keep your HTML as-is (no rewriting), just slice on closing </p>.
 */
function splitIntoParagraphs(html: string): string[] {
  const raw = String(html)
  const parts = raw
    .split(/<\/p>/i)
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => (p.endsWith('</p>') ? p : p + '</p>'))
  return parts.length ? parts : [raw]
}

export default async function AIDescription({ city, kind, html }: Props) {
  if (!html) return null

  // Server-side fetch of curated inline images for this city/kind
  const images = await getLandingInlineImages(city, kind)
  // Choose safe insertion points (after para 1 and 3; add more if we have more images)
  const insertAfter = [1, 3, 5, 7]

  const paras = splitIntoParagraphs(html)

  let imgIdx = 0
  const nodes: React.ReactNode[] = []
  paras.forEach((p, i) => {
    nodes.push(
      <div key={`p-${i}`} dangerouslySetInnerHTML={{ __html: p }} />
    )
    if (insertAfter.includes(i + 1) && images[imgIdx]) {
      const img = images[imgIdx++]
      nodes.push(
        <figure
          key={`img-${i}`}
          className="my-8 overflow-hidden rounded-2xl border bg-white/40 shadow-sm"
        >
          {/* using next/image for perf; fall back to <img> if you prefer */}
          <Image
            src={img.url}
            alt={img.alt}
            width={900}
            height={600}
            className="w-full object-cover max-h-80"
            priority={false}
          />
          {/* caption intentionally removed to avoid overlay text shown on images */}
        </figure>
      )
    }
  })

  return (
    <section className="max-w-none">
      <h2 className="mb-3 text-2xl font-semibold tracking-tight text-brand-midnightCove">
        About This City
      </h2>

      {/* nicer reading experience */}
      <div className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none
                      prose-headings:scroll-mt-24
                      prose-p:leading-8 prose-p:my-5
                      prose-li:my-1.5 prose-ol:my-5 prose-ul:my-5
                      prose-strong:text-brand-midnightCove">
        {nodes}
      </div>
    </section>
  )
}
