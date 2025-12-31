import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { LandingFAQ } from '@/types/landing'

interface Props { items?: LandingFAQ[] }

export default function FAQSection({ items }: Props) {
  if (!items || items.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#fcba03' }}>FAQ</h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
