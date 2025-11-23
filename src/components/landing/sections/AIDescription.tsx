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
import React from "react";
import Image from "next/image";
import { getLandingInlineImages } from "@/lib/landing/image";
import {
  parseIntoSections,
  type ParsedSection,
} from "@/lib/landing/parseSections";

type Props = {
  city: string;
  kind: string;
  html?: string;
};

/**
 * Generate contextual image query based on section heading
 */
function getImageQueryForSection(
  city: string,
  heading: string,
  index: number
): string {
  const headingLower = heading.toLowerCase();

  if (headingLower.includes("market") || headingLower.includes("landscape")) {
    return `${city} real estate downtown skyline architecture`;
  } else if (
    headingLower.includes("lifestyle") ||
    headingLower.includes("living")
  ) {
    return `${city} urban lifestyle modern amenities people`;
  } else if (headingLower.includes("neighborhood")) {
    return `${city} residential neighborhood street trees homes`;
  } else if (
    headingLower.includes("ownership") ||
    headingLower.includes("investment")
  ) {
    return `${city} modern condo building exterior architecture`;
  } else if (
    headingLower.includes("transportation") ||
    headingLower.includes("connectivity")
  ) {
    return `${city} transportation public transit urban mobility`;
  } else if (
    headingLower.includes("working with") ||
    headingLower.includes("service")
  ) {
    return `professional real estate agent consultation modern office`;
  }

  // Default queries based on position
  const defaultQueries = [
    `${city} cityscape urban skyline daytime`,
    `${city} residential buildings modern architecture`,
    `${city} downtown streets lifestyle scene`,
    `${city} waterfront parks outdoor lifestyle`,
  ];

  return defaultQueries[index % defaultQueries.length];
}

export default async function AIDescription({ city, kind, html }: Props) {
  if (!html) {
    console.warn("⚠️ [AIDescription] No HTML content provided", { city, kind });
    return null;
  }

  console.log("🎨 [AIDescription] START Rendering", {
    city,
    kind,
    htmlLength: html.length,
    htmlPreview: html.slice(0, 200) + "...",
  });

  // Parse content into sections
  const sections: ParsedSection[] = parseIntoSections(html);
  console.log("📊 [AIDescription] Parsed sections", {
    count: sections.length,
    sections: sections.map((s, i) => ({
      index: i,
      hasHeading: !!s.heading,
      headingPreview: s.heading
        ? s.heading.replace(/<[^>]+>/g, "").slice(0, 50)
        : "none",
      contentLength: s.content.length,
    })),
  });

  // Fetch images
  console.log("🖼️ [AIDescription] Fetching images...", { city, kind });
  const images = await getLandingInlineImages(city, kind);
  console.log("🖼️ [AIDescription] Images fetched", {
    count: images.length,
    positions: images.map((i) => i.position),
    urls: images.map((i) => i.url.slice(0, 60) + "..."),
  });

  // Determine nicer page title based on kind
  const pageTitle = kind.includes("condo")
    ? "condo buyers"
    : kind.includes("under-500k")
    ? "home buyers"
    : kind.includes("pool")
    ? "pool home buyers"
    : kind.includes("luxury")
    ? "luxury home buyers"
    : "buyers";

  return (
    <section className="max-w-none space-y-16">
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-midnightCove">
          About {city}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
          Discover what makes {city} an excellent choice for {pageTitle}
        </p>
      </div>

      {sections.map((section) => {
        const index = section.index;
        // Image placement rules:
        // - If we only have a single section (common when AI output uses one big block),
        //   show the first inline image directly under that section so the page is
        //   visually rich.
        // - Otherwise, show an image after sections 1, 3, 5, 7 (every other section,
        //   starting after the first content section) using a stable index.

        let imageIndex = -1;

        // If only 1 section → ALWAYS show first image
        if (sections.length === 1) {
          imageIndex = 0;
        } else {
          imageIndex = index % 2 === 1 ? Math.floor(index / 2) : -1;
        }

        const shouldShowImage = imageIndex >= 0 && !!images[imageIndex];
        const image = shouldShowImage ? images[imageIndex] : null;

        console.log(`📄 [AIDescription] Rendering section ${index}:`, {
          hasHeading: !!section.heading,
          headingText: section.heading
            ? section.heading.replace(/<[^>]+>/g, "").slice(0, 50)
            : "none",
          contentLength: section.content.length,
          shouldShowImage,
          imageIndex,
          hasImage: !!image,
          imageUrl: image ? image.url.slice(0, 60) + "..." : "none",
        });

        return (
          <article key={index} className="space-y-10">
            {/* Section Content with improved typography */}
            <div
              className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none
             prose-headings:scroll-mt-24 prose-headings:font-extrabold prose-headings:text-brand-midnightCove
             prose-h2:text-2xl sm:prose-h2:text-4xl prose-h2:mb-6 prose-h2:mt-12 first:prose-h2:mt-0 prose-h2:leading-tight
             prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8
             prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base sm:prose-p:text-lg
             prose-ul:list-disc prose-ul:ml-6 prose-ul:space-y-3 prose-ul:my-6
             prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:leading-relaxed
             prose-strong:text-brand-midnightCove prose-strong:font-semibold
             prose-a:text-brand-midnightCove prose-a:no-underline hover:prose-a:underline
             [&>*:first-child]:mt-0"
            >
              {section.heading && (
                <h2
                  className="text-3xl sm:text-4xl font-extrabold text-brand-midnightCove mt-12 mb-6"
                  dangerouslySetInnerHTML={{
                    __html: section.heading.replace(/<\/?h2>/g, ""),
                  }}
                />
              )}

              <div
                className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none
             prose-p:leading-relaxed prose-p:mb-6"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>

            {/* Contextual Image with better styling */}
            {image && (
              <figure className="relative w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl my-10 group">
                <Image
                  src={image.url}
                  alt={
                    image.alt ||
                    `${city} real estate - ${section.heading
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 50)}`
                  }
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  priority={index <= 2}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
              </figure>
            )}
          </article>
        );
      })}
    </section>
  );
}
