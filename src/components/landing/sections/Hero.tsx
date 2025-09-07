import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getLandingHeroImage } from '@/lib/landing/image';

interface Props { city: string; kind: string; image?: string }

const kindLabel: Record<string, string> = {};

function kindToHeading(kind: string, city: string) {
  const pretty = kind.replace(/-/g, ' ')
  // Capitalize each word
  const cap = pretty.replace(/\b\w/g, c => c.toUpperCase())
  return `${cap} in ${city}`
}

export default async function Hero({ city, kind, image }: Props) {
  const title = kindToHeading(kind, city)
  // If no image prop provided, attempt dynamic fetch / cache lookup.
  let heroImage = image
  if (!heroImage) {
    try {
      heroImage = await getLandingHeroImage(city, kind)
  if (process.env.LANDING_TRACE) console.log('[landing.hero.component] fetched image', { city, kind, has: !!heroImage })
    } catch {
      // swallow errors; fallback to blank
  if (process.env.LANDING_TRACE) console.warn('[landing.hero.component] fetch exception', { city, kind })
    }
  }
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-background shadow-lg">
      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-stretch">
        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-brand-midnightCove">
            {title}
          </h1>
          <p className="text-gray-600 max-w-prose text-base md:text-lg leading-relaxed">
            Explore market stats, featured listings, neighborhoods, schools, and trends – purpose-built to help you evaluate the {city} real estate market.
          </p>
        </div>
        <div className="relative min-h-[240px] md:min-h-full">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={`${city} homes hero`}
              fill
              priority
              className="object-cover rounded-xl shadow-md"
            />
          ) : (
            <div className="h-full w-full bg-muted rounded-xl" />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-background/40 to-background/0" />
        </div>
      </div>
    </section>
  );
}
