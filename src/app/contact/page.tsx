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
    <main className="pt-24 pb-16 bg-white dark:bg-slate-900 theme-transition">
      {/* Enhanced Header Section */}
      <section className="bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900/20 py-16 md:py-20 relative overflow-hidden theme-transition">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-primary-400 dark:bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-accent-400 dark:bg-cyan-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Get In Touch</span>
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-balance theme-transition">
              Contact
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Our Team</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl mx-auto text-balance theme-transition">
              We're here to help with all your real estate needs. Reach out to us using the form below or visit our office.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-16">
          <ContactForm />
          <OfficeLocation />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 rounded-3xl border border-neutral-200/50 dark:border-slate-700/50 shadow-strong">
            <SocialMediaLinks />
          </div>
        </div>
      </div>
    </main>
  )
}
