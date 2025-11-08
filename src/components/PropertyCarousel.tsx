"use client";
import Image from "next/image";
import { useState } from "react";

export default function PropertyCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const safe = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (!safe.length) {
    return (
      <div className="aspect-[16/9] w-full rounded-xl bg-gray-100 grid place-items-center text-gray-500">
        No photos available
      </div>
    );
  }
  const next = () => setI((p) => (p + 1) % safe.length);
  const prev = () => setI((p) => (p - 1 + safe.length) % safe.length);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border">
      <Image
        src={safe[i]}
        alt={`${alt} - Photo ${i + 1}`}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-sm shadow"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-sm shadow"
      >
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-white/80 px-2 py-1 text-xs">
        {i + 1} / {safe.length}
      </div>
    </div>
  );
}