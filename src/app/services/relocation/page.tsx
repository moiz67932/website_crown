import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Star,
  MapPin,
  School,
  Home,
  Clock,
  Users,
  Phone,
  Mail,
  Calendar,
  Compass,
  Heart,
  Shield,
  Target,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Tailored Relocation Solutions | Crown Coastal Homes",
  description:
    "Personalized relocation services for moving to California's coast. Property search, area orientation, school information, and comprehensive moving support.",
}

const relocationServices = [
  {
    title: "Personalized Property Search",
    description: "Customized property search based on your lifestyle preferences, budget, and specific requirements.",
    icon: Home,
    features: [
      "Detailed lifestyle consultation",
      "Custom property matching criteria",
      "Virtual and in-person property tours",
      "Neighborhood compatibility analysis",
      "Market timing and pricing strategy",
    ],
  },
  {
    title: "Area Orientation Tours",
    description:
      "Comprehensive guided tours of potential neighborhoods and communities to help you make informed decisions.",
    icon: Compass,
    features: [
      "Personalized neighborhood tours",
      "Local amenities and attractions overview",
      "Transportation and commute analysis",
      "Shopping and dining recommendations",
      "Recreation and entertainment options",
    ],
  },
  {
    title: "School and Community Information",
    description: "Detailed information about local schools, community services, and family-friendly amenities.",
    icon: School,
    features: [
      "Public and private school ratings",
      "Enrollment procedures and requirements",
      "Extracurricular activities overview",
      "Community centers and libraries",
      "Youth sports and programs",
    ],
  },
  {
    title: "Temporary Housing Assistance",
    description: "Short-term housing solutions while you search for your permanent home or during transition periods.",
    icon: Clock,
    features: [
      "Corporate housing arrangements",
      "Extended stay hotel negotiations",
      "Furnished rental options",
      "Pet-friendly accommodations",
      "Flexible lease terms",
    ],
  },
  {
    title: "Local Service Provider Connections",
    description: "Introductions to trusted local professionals and service providers to ease your transition.",
    icon: Users,
    features: [
      "Healthcare provider referrals",
      "Legal and financial advisors",
      "Home maintenance services",
      "Childcare and eldercare options",
      "Professional networking opportunities",
    ],
  },
]

const relocationBenefits = [
  {
    title: "Stress-Free Transition",
    description: "We handle the details so you can focus on your family and career during the move.",
    icon: Shield,
    stat: "95% stress reduction",
  },
  {
    title: "Local Expertise",
    description: "Deep knowledge of California coastal communities and their unique characteristics.",
    icon: Target,
    stat: "15+ years local experience",
  },
  {
    title: "Time Savings",
    description: "Efficient process that saves you weeks of research and property searching.",
    icon: Clock,
    stat: "Save 6+ weeks",
  },
  {
    title: "Personalized Service",
    description: "Customized approach tailored to your specific needs and preferences.",
    icon: Heart,
    stat: "100% personalized plans",
  },
]

const relocationProcess = [
  {
    step: 1,
    title: "Initial Consultation",
    description: "Comprehensive discussion of your relocation needs, timeline, and preferences.",
    duration: "1-2 hours",
  },
  {
    step: 2,
    title: "Area Research & Planning",
    description: "Detailed research and planning based on your specific requirements and lifestyle.",
    duration: "3-5 days",
  },
  {
    step: 3,
    title: "Orientation Visit",
    description: "Guided tour of recommended areas with property viewings and community exploration.",
    duration: "2-3 days",
  },
  {
    step: 4,
    title: "Property Selection",
    description: "Assistance with property selection, negotiation, and purchase or lease agreements.",
    duration: "2-4 weeks",
  },
  {
    step: 5,
    title: "Move Coordination",
    description: "Support with moving logistics, utility setup, and local service connections.",
    duration: "2-3 weeks",
  },
  {
    step: 6,
    title: "Post-Move Support",
    description: "Ongoing assistance with settling in and connecting with the local community.",
    duration: "Ongoing",
  },
]

const clientTestimonials = [
  {
    quote:
      "The relocation team made our move from New York to San Diego seamless. They found us the perfect home and helped our kids transition to new schools. Exceptional service!",
    author: "The Johnson Family",
    location: "Relocated to San Diego, CA",
    origin: "From New York, NY",
    rating: 5,
  },
  {
    quote:
      "As a corporate executive, I needed a smooth relocation process. Crown Coastal handled everything from temporary housing to finding our dream home in Malibu.",
    author: "David Chen, CEO",
    location: "Relocated to Malibu, CA",
    origin: "From Chicago, IL",
    rating: 5,
  },
  {
    quote:
      "Their knowledge of the local schools and communities was invaluable. They helped us find the perfect neighborhood for our family's needs.",
    author: "Maria & Carlos Rodriguez",
    location: "Relocated to Santa Barbara, CA",
    origin: "From Phoenix, AZ",
    rating: 5,
  },
]

const popularDestinations = [
  {
    city: "San Diego",
    description: "Year-round perfect weather, beaches, and family-friendly communities.",
    highlights: ["Top-rated schools", "Biotech industry", "Military-friendly"],
  },
  {
    city: "Los Angeles",
    description: "Entertainment capital with diverse neighborhoods and career opportunities.",
    highlights: ["Entertainment industry", "Cultural diversity", "Business hub"],
  },
  {
    city: "San Francisco",
    description: "Tech innovation center with stunning bay views and urban amenities.",
    highlights: ["Tech industry", "Public transportation", "Cultural attractions"],
  },
  {
    city: "Santa Barbara",
    description: "Charming coastal city with wine country and Mediterranean climate.",
    highlights: ["Wine country", "Arts community", "Outdoor recreation"],
  },
]

export default function RelocationPage() {
  return (
    <div className="bg-brand-californiaSand min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/modern-ocean-house.png"
          alt="Happy family with SOLD sign celebrating successful relocation to California"
          fill
          className="object-cover object-right"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-right">
          <Badge className="mb-4 bg-brand-goldenHour text-brand-midnightCove px-4 py-2 text-sm font-semibold">
            Relocation Specialists
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-heading text-brand-white shadow-text">
            Tailored Relocation
            <span className="block text-brand-goldenHour drop-shadow-md">Solutions</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl ml-auto shadow-text leading-relaxed">
            Personalized relocation services designed to make your transition to coastal California seamless and
            stress-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              size="lg"
              className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4 text-lg"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Start Your Relocation
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-brand-white text-black hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4 text-lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Speak with Specialist
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Relocation Services */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Comprehensive Relocation Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our full-service relocation assistance covers every aspect of your move to California's coastal
              communities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {relocationServices.map((service, index) => (
              <Card key={index} className="bg-brand-white shadow-medium hover:shadow-strong transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="bg-brand-pacificTeal/10 rounded-lg p-3 mr-4">
                      <service.icon className="h-8 w-8 text-brand-pacificTeal" />
                    </div>
                    <CardTitle className="text-xl text-brand-midnightCove">{service.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base mb-4 leading-relaxed">
                    {service.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-brand-pacificTeal mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="mb-20 bg-brand-white p-8 sm:p-12 rounded-xl shadow-medium">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Popular Relocation Destinations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the unique characteristics of California's most sought-after coastal communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <Card key={index} className="bg-brand-californiaSand/30 shadow-subtle">
                <CardHeader>
                  <CardTitle className="text-lg text-brand-midnightCove flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-brand-pacificTeal" />
                    {destination.city}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4 leading-relaxed">
                    {destination.description}
                  </CardDescription>
                  <ul className="space-y-1">
                    {destination.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-sm text-brand-pacificTeal font-medium">
                        • {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Relocation Process */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Our Relocation Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach designed to make your relocation as smooth and efficient as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relocationProcess.map((step, index) => (
              <Card key={index} className="bg-brand-white shadow-medium">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-brand-sunsetBlush rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg">
                      {step.step}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {step.duration}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-brand-midnightCove">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Why Choose Our Relocation Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the benefits of working with relocation specialists who understand your unique needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {relocationBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-brand-goldenHour/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-brand-goldenHour" />
                </div>
                <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">{benefit.title}</h3>
                <p className="text-gray-600 mb-3">{benefit.description}</p>
                <div className="text-2xl font-bold text-brand-sunsetBlush">{benefit.stat}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Successful Relocations</h2>
            <p className="text-xl text-gray-600">
              Hear from families who made California their new home with our help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {clientTestimonials.map((testimonial, index) => (
              <Card key={index} className="bg-brand-white shadow-medium">
                <CardHeader>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-brand-goldenHour fill-brand-goldenHour" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-gray-600 italic mb-6 leading-relaxed">"{testimonial.quote}"</blockquote>
                  <div className="border-t border-brand-silverMist/50 pt-4">
                    <p className="font-semibold text-brand-graphitePeak">{testimonial.author}</p>
                    <p className="text-sm text-gray-500 mb-1">{testimonial.location}</p>
                    <p className="text-sm font-semibold text-brand-pacificTeal">{testimonial.origin}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-brand-midnightCove text-brand-white shadow-strong">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-brand-goldenHour mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make California Your Home?</h2>
              <p className="text-xl text-brand-californiaSand/90 mb-8 max-w-2xl mx-auto">
                Let our relocation specialists guide you through every step of your move to California's beautiful
                coastal communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Relocation Consultation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Download Relocation Guide
                </Button>
              </div>
              <p className="text-sm text-brand-californiaSand/70 mt-6">
                Complimentary consultation for all relocation services. No obligation required.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
