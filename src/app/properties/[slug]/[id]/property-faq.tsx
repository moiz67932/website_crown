"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../../../../lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface PropertyFAQProps {
  faqs: FAQItem[]
  propertyType: string
  propertyAddress: string
}

export default function PropertyFAQ({ faqs, propertyType, propertyAddress }: PropertyFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
            itemScope
            itemType="https://schema.org/Question"
          >
            <button
              className={cn(
                "flex justify-between items-center w-full p-4 text-left font-medium focus:outline-none",
                openIndex === index ? "bg-gray-50" : "bg-white",
              )}
              onClick={() => toggleFAQ(index)}
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <span itemProp="name" className="text-lg">
                {faq.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            <div
              id={`faq-answer-${index}`}
              className={cn(
                "px-4 overflow-hidden transition-all duration-200",
                openIndex === index ? "max-h-96 pb-4" : "max-h-0",
              )}
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <div itemProp="text" className="text-gray-600">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
