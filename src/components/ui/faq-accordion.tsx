"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  faqs: FAQItem[];
  className?: string;
}

/**
 * SEO-optimized FAQ Accordion Component
 * - All answers are rendered in the DOM on page load (SEO-friendly)
 * - JavaScript only toggles visibility, not content existence
 * - Uses proper semantic HTML with h3 for questions
 * - Accessible with keyboard navigation
 */
export function FAQAccordion({ faqs, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="border border-neutral-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            {/* Question Button */}
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors duration-200"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 pr-4">
                {faq.question}
              </h3>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {/* Answer - Always in DOM, visibility controlled by CSS */}
            <div
              id={`faq-answer-${index}`}
              className={cn(
                "px-6 pb-6 text-neutral-700 dark:text-neutral-300 leading-relaxed transition-all duration-300",
                isOpen
                  ? "opacity-100 max-h-[1000px]"
                  : "opacity-0 max-h-0 overflow-hidden"
              )}
              aria-hidden={!isOpen}
            >
              <div className="pt-2 border-t border-neutral-100 dark:border-slate-700">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact FAQ List - No accordion, all answers visible
 * Use this when you want everything expanded for maximum SEO visibility
 */
export function FAQList({ faqs, className }: FAQAccordionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border-l-4 border-primary-500 dark:border-primary-400 pl-6 py-2"
        >
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {faq.question}
          </h3>
          <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
