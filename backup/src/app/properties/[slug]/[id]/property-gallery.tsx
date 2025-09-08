"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Expand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface PropertyGalleryProps {
  images: string[]
}

export default function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }

  const goToNext = () => {
    const isLastImage = currentIndex === images.length - 1
    const newIndex = isLastImage ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
  }

  return (
    <div className="relative">
      {/* Main Gallery View */}
      <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden">
        {images[currentIndex] ? (
          <img
            src={images[currentIndex]}
            alt={`Property image ${currentIndex + 1}`}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200">
            <span className="text-gray-500">Image not available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
          onClick={goToNext}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Fullscreen Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 bg-white/80 hover:bg-white/90 text-black rounded-full h-10 w-10"
            >
              <Expand className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl">
            <div className="relative h-[80vh]">
              <img
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`Property image ${currentIndex + 1}`}
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`relative h-20 w-32 rounded-md overflow-hidden flex-shrink-0 transition ${
              index === currentIndex ? "ring-2 ring-primary" : "opacity-70"
            }`}
          >
            <img
              src={image || "/placeholder.svg"}
              alt={`Property thumbnail ${index + 1}`}
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
