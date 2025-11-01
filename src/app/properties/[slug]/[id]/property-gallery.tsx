"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Expand, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../../../../components/ui/dialog"

interface PropertyGalleryProps {
  images: string[]
}

type FitMode = "contain" | "cover" | "auto"

export default function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // --- keep your proxify behavior exactly ---
  const proxify = (url?: string | null) => {
    if (!url) return undefined
    if (url.startsWith("/")) return url
    if (url.includes("/api/media?")) return url
    try {
      if (/^https?:/i.test(url)) return `/api/media?url=${encodeURIComponent(url)}`
    } catch {}
    return url
  }

  const safeImages = useMemo(
    () => (images || []).filter(Boolean).map((u) => proxify(u) || u),
    [images]
  )

  // clamp index if images array changes
  useEffect(() => {
    if (currentIndex > Math.max(safeImages.length - 1, 0)) {
      setCurrentIndex(0)
    }
  }, [safeImages.length, currentIndex])

  // --- Option B: auto-switch to "contain" when an image is portrait ---
  const [isPortrait, setIsPortrait] = useState<Record<number, boolean>>({})

  // --- Optional polish: user-toggle between Fit (contain) and Fill (cover) ---
  // When fitMode = "auto", we use the auto portrait detection;
  // when user toggles, we force either contain or cover.
  const [fitMode, setFitMode] = useState<FitMode>("auto")

  const getObjectFit = (index: number) => {
    if (fitMode === "contain") return "object-contain"
    if (fitMode === "cover") return "object-cover"
    // auto: use portrait detection
    return isPortrait[index] ? "object-contain" : "object-cover"
  }

  const goToPrevious = () => {
    const last = Math.max(safeImages.length - 1, 0)
    setCurrentIndex((prev) => (prev <= 0 ? last : prev - 1))
  }

  const goToNext = () => {
    const last = Math.max(safeImages.length - 1, 0)
    setCurrentIndex((prev) => (prev >= last ? 0 : prev + 1))
  }

  // accessibility: arrow keys navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [safeImages.length])

  return (
    <div className="relative">
      {/* Main Gallery View */}
      <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-black">
        {safeImages.length > 0 ? (
          <>
            <Image
              src={safeImages[currentIndex]}
              alt={`Property image ${currentIndex + 1}`}
              fill
              className={`${getObjectFit(currentIndex)} transition-transform duration-300`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              loading={currentIndex === 0 ? "eager" : "lazy"}
              priority={currentIndex === 0}
              onLoadingComplete={(img) => {
                const portrait = img.naturalHeight > img.naturalWidth
                setIsPortrait((prev) =>
                  prev[currentIndex] === portrait ? prev : { ...prev, [currentIndex]: portrait }
                )
              }}
              onError={(e) => {
                try {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder-image.jpg"
                } catch {}
              }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </>
        ) : (
          <div className="rounded-2xl bg-gray-100 text-gray-500 h-80 w-full flex items-center justify-center">
            No Image Available
          </div>
        )}

        {/* Navigation Buttons */}
        {safeImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Controls (Fullscreen + Fit/Fill toggle) */}
        <div className="absolute right-4 top-4 flex gap-2">
          {/* Fit/Fill toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={fitMode === "cover" ? "Switch to Fit" : fitMode === "contain" ? "Switch to Fill" : "Toggle Fit/Fill"}
            title={
              fitMode === "cover"
                ? "Fill: image crops to fill frame. Click to switch to Fit."
                : fitMode === "contain"
                ? "Fit: entire image visible. Click to switch to Fill."
                : "Auto: portrait images fit, landscape fill. Click to toggle."
            }
            className="bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
            onClick={() => {
              // Cycle: auto -> contain -> cover -> auto
              setFitMode((m) => (m === "auto" ? "contain" : m === "contain" ? "cover" : "auto"))
            }}
          >
            {fitMode === "cover" ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>

          {/* Fullscreen */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open fullscreen"
                className="bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
              >
                <Expand className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <div className="relative h-[80vh] bg-black rounded-xl overflow-hidden">
                {safeImages.length > 0 ? (
                  <Image
                    src={safeImages[currentIndex]}
                    alt={`Property image ${currentIndex + 1}`}
                    fill
                    className={`${getObjectFit(currentIndex)} transition-transform duration-300`}
                    sizes="100vw"
                    loading="lazy"
                    onLoadingComplete={(img) => {
                      const portrait = img.naturalHeight > img.naturalWidth
                      setIsPortrait((prev) =>
                        prev[currentIndex] === portrait ? prev : { ...prev, [currentIndex]: portrait }
                      )
                    }}
                    onError={(e) => {
                      try {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder-image.jpg"
                      } catch {}
                    }}
                  />
                ) : (
                  <div className="rounded-2xl bg-gray-100 text-gray-500 h-full w-full flex items-center justify-center">
                    No Image Available
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Image Counter */}
        {safeImages.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {safeImages.length > 0 ? (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {safeImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Thumbnail ${index + 1}`}
              className={`relative h-20 w-32 rounded-md overflow-hidden flex-shrink-0 transition ${
                index === currentIndex ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              }`}
              title={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`Property thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 200px"
                loading="lazy"
                onError={(e) => {
                  try {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-image.jpg"
                  } catch {}
                }}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
