import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion'
import { LandingFAQ } from '../../../types/landing'

interface Props { items?: LandingFAQ[] }

export default function FAQSection({ items }: Props) {
  if (!items || items.length === 0) return null
  return (
    <section className="bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8">
      <h2 className="text-center text-[#1E3557] text-3xl md:text-4xl mb-4 font-bold">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full divide-y divide-slate-200">
        {items.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-slate-800 text-lg">{f.q}</AccordionTrigger>
            <AccordionContent className="text-slate-600">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
