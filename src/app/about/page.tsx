import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "About Us | Real Estate",
  description: "Learn more about our real estate company, our mission, and our team.",
}

export default function AboutPage() {
  return (
    <main className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">About Our Company</h1>
            <p className="text-lg text-slate-600 mb-6">
              We're a dedicated team of real estate professionals committed to helping you find your perfect home.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 mb-4">
                Our mission is to provide exceptional real estate services with integrity, professionalism, and
                attention to detail. We strive to exceed our clients' expectations and make their real estate journey
                smooth and successful.
              </p>
              <p className="text-slate-600">
                Whether you're buying your first home, selling a property, or investing in real estate, our team is here
                to guide you every step of the way.
              </p>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden">
              <Image src="/modern-real-estate-office.png" alt="Our modern office space" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Principal Broker",
                image: "/professional-woman-portrait.png",
                bio: "With over 15 years of experience in real estate, Sarah leads our team with expertise and passion.",
              },
              {
                name: "Michael Chen",
                role: "Senior Agent",
                image: "/professional-man-portrait.png",
                bio: "Michael specializes in luxury properties and has a keen eye for investment opportunities.",
              },
              {
                name: "Emily Rodriguez",
                role: "Client Relations",
                image: "/woman-portrait.png",
                bio: "Emily ensures our clients receive personalized attention and support throughout their journey.",
              },
            ].map((member, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="relative h-48 mb-4 rounded-md overflow-hidden">
                  <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{member.name}</h3>
                <p className="text-slate-500 mb-2">{member.role}</p>
                <p className="text-slate-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Local Expertise",
                description: "Our team has deep knowledge of the local real estate market and neighborhoods.",
              },
              {
                title: "Client-Focused Approach",
                description: "We prioritize your needs and work tirelessly to achieve your real estate goals.",
              },
              {
                title: "Proven Results",
                description: "Our track record speaks for itself with hundreds of successful transactions.",
              },
            ].map((item, index) => (
              <div key={index} className="p-6 border border-slate-200 rounded-lg">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Browse our listings or get in touch with our team to start your real estate journey today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/properties">
              <Button size="lg" variant="default">
                Browse Properties
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white hover:text-slate-800"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
