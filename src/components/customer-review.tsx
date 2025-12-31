"use client"

import { Star } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { useEffect, useState } from "react"

// Truncate at nearest word boundary (avoid cutting words in half)
function truncateAtWord(text: string, limit = 300) {
  if (!text) return text
  if (text.length <= limit) return text
  const slice = text.slice(0, limit)
  const lastSpace = slice.lastIndexOf(" ")
  if (lastSpace === -1) return slice + "..."
  return slice.slice(0, lastSpace) + "..."
}

const CustomerReview = () => {
  // Track which testimonials are expanded. We allow multiple expanded per row,
  // but only one row may have expanded items at a time. Clicking a card in a
  // different row will collapse expanded items from the previous row.
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set())
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [cols, setCols] = useState<number>(1)

  useEffect(() => {
    // Determine columns based on current viewport to calculate row indices.
    function calcCols() {
      if (typeof window === "undefined") return 1
      const w = window.innerWidth
      if (w >= 1024) return 3
      if (w >= 768) return 2
      return 1
    }

    function apply() {
      setCols(calcCols())
    }

    apply()
    window.addEventListener("resize", apply)
    return () => window.removeEventListener("resize", apply)
  }, [])

  const handleCardClick = (index: number) => {
    const row = Math.floor(index / cols)

    // If clicking the already-active row, collapse it.
    if (activeRow === row) {
      setExpandedSet(new Set())
      setActiveRow(null)
      return
    }

    // Otherwise expand the entire row (all indices that fall in that row)
    const rowIndices = testimonials
      .map((_, i) => i)
      .filter((i) => Math.floor(i / cols) === row)
    setExpandedSet(new Set(rowIndices))
    setActiveRow(row)
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 hide-scrollbar">
        {testimonials.map((testimonial, index) => {
          const isExpanded = expandedSet.has(index)
          return (
            <Card
              key={index}
              onClick={() => handleCardClick(index)}
              role="button"
              aria-expanded={isExpanded}
              className={`overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer transition-shadow ${isExpanded ? "shadow-lg" : "shadow-sm"}`}>
              <CardContent className="p-4 md:p-8 relative">
                <div className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-200 dark:text-slate-600">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="md:w-[60px] md:h-[60px]"
                  >
                    <path
                      d="M11.3 6.2H16.7L13.2 12.8V17.8H18.8V12.8H16.7L20.2 6.2V2.4H11.3V6.2ZM2.8 6.2H8.2L4.7 12.8V17.8H10.3V12.8H8.2L11.7 6.2V2.4H2.8V6.2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="relative h-10 w-10 md:h-14 md:w-14 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-slate-900 dark:text-neutral-100">{testimonial.name}</h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>

                <blockquote className="text-gray-600 dark:text-neutral-300 italic mb-6 leading-relaxed">
                  {isExpanded ? `"${testimonial.text}"` : `"${truncateAtWord(testimonial.text, 300)}"`}
                </blockquote>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default CustomerReview

const testimonials = [
  {
    name: "Mario & Sylvia Jacobo",
    avatar: "/client/mario_sylvia.jpg",
    text: "Working with Reza meant to be working with excellency! We had an incredible experience, due to his professionalism, was very knowledgeable, and truly invested his willingness and time in helping us find the place we chose. One of the things that personally liked the most was his charisma; very approachable whenever we came to him with questions. But best of all, he’s very respectful in our requests whether they were religious faith, which was very important for us. He always took the time to understand exactly what we were looking for and guided us through every step of the process with patience and professionalism. We appreciated his sharp eye for detail, another plus for us, and more importantly, his honest advice gave us confidence in our decision to go for the place in Temecula, where we could be closer to our children. We couldn’t have asked for a better agent and we highly recommend Reza Barghlameno to anyone looking to buy a home.",
  },
  {
    name: "Fern Siegel",
    avatar: "/client/fern_siegel.jpg",
    text: "Reza Barghlalmeno made buying our home such an incredible experience—one of the best we’ve had as a family, and I’ve been through quite a few home purchases in my 80+ years! From the first phone call, Reza completely put us at ease. He was kind, professional, and so detail-oriented that the entire process felt seamless. We closed in just 18 days, and everything went so smoothly on our end, thanks to his hard work behind the scenes. This house is everything we dreamed of. Reza wasn’t just helping us buy a house—he was helping us find a home for the next chapter of our lives. He went above and beyond at every step, from handling negotiations to managing all the small details to checking in with us even after the sale was done. I honestly couldn’t be more grateful. If you get the chance to work with Reza, you’re in the best hands possible.",
  },
  {
    name: "Maxim Gantman",
    avatar: "/client/maxim_gantman.jpg",
    text: "I recently had the pleasure of working with Reza and I cannot speak highly enough of the exceptional experience I had. From start to finish, Reza went above and beyond to ensure that my home buying process was as smooth as possible. He took the time to listen to my needs, preferences, and concerns, and provided insightful advice on every property we viewed. His attention to detail, responsiveness, and dedication were truly impressive. Whether it was answering questions late at night or scheduling last-minute viewings, Reza was always there for me. If you are looking for a realtor who will go the extra mile and ensure you have an outstanding experience, I cannot recommend Reza enough.",
  },
  {
    name: "Mary Jane Gantman",
    avatar: "/client/mary_jane_gantman.jpg",
    text: "My husband and I are first time buyers in San Diego. From the moment we met him, Reza has been helpful, understanding, patient, professional, empathetic, and has operated with the highest level of integrity. Reza stuck through a huge amount of hurdles with us over the last 7 months. He kept us updated both by text and over the phone during every step, and was able to explain the issues at hand in language that allowed us to understand the legalities and complications. His diligence has allowed us to find the home that we are excited to raise our children in. Thank you, Reza, for all that you have done for our family. We can't wait to have you over for dinner once we are moved in!",
  },
  {
    name: "Russell MacQueen",
    avatar: "/client/russell_macqueen.jpeg",
    text: "Reza was the best agent we have ever worked with. His expertise was beyond belief. He had an approach working with a new realty group that allowed us to make updates to our home and within 3 weeks we had one three day showing and we had 5 offers over asking price. His thoughtfulness kept us on track without stressing us and assured us we would reach our goal to not only sell our home but he worked diligently to find a new home. We are forever grateful for him and FAM Realtor Group for all the personal efforts they put in to help us sell our home and find a new home.",
  },
  {
    name: "Pulkit Kaushal",
    avatar: "/client/pulkit_kaushal.jpg",
    text: "Reza was incredibly helpful in our home search and in securing our first house! He had knowledge about the area and was always responsive to our questions. He made our first time homeownership process very seamless and handled contact with the seller's agent easily. We highly recommend Reza as he treats his clients as if they were family and wants to make sure the best service is given to them. We really appreciate all his efforts and him being our agent for our first home!",
  },
]

/*
  Previous testimonials preserved here for reference (commented out):

  [
    { name: "Jacob Oenter", avatar: "/client/client1.jpeg", text: "..." },
    { name: "Maxim Gantman", avatar: "/client/client2.jpeg", text: "..." },
    { name: "Jill Conaty", avatar: "/client/client4.jpeg", text: "..." }
  ]

*/