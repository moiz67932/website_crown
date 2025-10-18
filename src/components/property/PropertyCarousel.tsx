// src/components/property/PropertyCarousel.tsx
"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef } from "react";

type Img = { url: string; bytes?: number | null; createdAt?: string | null };

export default function PropertyCarousel({
  images,
  aspect = "aspect-[16/9]",
  className = "",
}: {
  images: Img[];
  aspect?: string; // tailwind aspect class
  className?: string;
}) {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const [emblaRef, api] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false },
    [autoplay.current]
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      // future: update dots, analytics, etc.
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!images?.length) {
    return (
      <div className="w-full rounded-2xl border bg-muted/20 p-8 text-center text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl shadow-lg ${className}`} ref={emblaRef}>
      <div className="flex">
        {images.map((img, i) => (
          <div className="relative flex-[0_0_100%]" key={`${img.url}-${i}`}>
            <div className={`relative w-full ${aspect}`}>
              <Image
                src={img.url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1000px"
                priority={i === 0}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
