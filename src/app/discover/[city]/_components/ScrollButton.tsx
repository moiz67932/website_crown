"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

export default function ScrollButton() {
  return (
    <>
         <button
              type="button"
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-20"
              onClick={() => {
                const container = document.querySelector('.hide-scrollbar');
                if (container) {
                  (container as HTMLElement).scrollBy({ left: 350, behavior: 'smooth' });
                }
              }}
            >
              <ChevronRightIcon />
            </button>
            <button
              type="button"
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-20"
              onClick={() => {
                const container = document.querySelector('.hide-scrollbar');
                if (container) {
                  (container as HTMLElement).scrollBy({ left: -350, behavior: 'smooth' });
                }
              }}
            >
              <ChevronLeftIcon />
            </button>
    </>
  )
}