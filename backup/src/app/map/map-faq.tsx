"use client"

import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function MapFAQ({ onClose }: { onClose: () => void }) {
  const faqs = [
    {
      question: "How do I search for properties on the map?",
      answer:
        "You can search for properties by panning and zooming the map, or by drawing a custom search area using the drawing tools. You can also use the filters to narrow down your search.",
    },
    {
      question: "How do I draw a search area?",
      answer:
        "To draw a search area, click on the 'Draw Area' button and then click on the map to start drawing a polygon. Double-click to complete the polygon. You can also draw a radius by clicking on the 'Draw Radius' button and then clicking on the map and dragging to create a circle.",
    },
    {
      question: "How do I filter properties?",
      answer:
        "To filter properties, click on the 'Filters' button and then select the filters you want to apply. You can filter by property type, status, price range, beds, baths, and more.",
    },
    {
      question: "How do I view property details?",
      answer:
        "To view property details, click on a marker on the map. A popup will appear with basic information about the property. Click on the 'View Details' button to view the full property details page.",
    },
    {
      question: "How do I save a property to my favorites?",
      answer:
        "To save a property to your favorites, click on the heart icon on the property popup or on the property details page. You must be logged in to save properties to your favorites.",
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <Accordion type="single" collapsible>
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
