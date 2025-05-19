import type { Metadata } from "next"
import ContactForm from "./contact-form"
import OfficeLocation from "./office-location"
import SocialMediaLinks from "./social-media-links"

export const metadata: Metadata = {
  title: "Contact Us | Real Estate",
  description: "Get in touch with our real estate team. We're here to help with all your property needs.",
}

export default function ContactPage() {
  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-slate-600">
            We're here to help with all your real estate needs. Reach out to us using the form below or visit our
            office.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <ContactForm />
          <OfficeLocation />
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <SocialMediaLinks />
          </div>
        </div>
      </div>
    </main>
  )
}
