import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Star,
  Users,
  Palette,
  Home,
  Scale,
  DollarSign,
  Crown,
  Phone,
  Mail,
  Calendar,
  Award,
  Shield,
  Network,
  Sparkles,
} from "lucide-react"

export const metadata: Metadata = {
  title: "World-Class Affiliate Network | Crown Coastal Homes",
  description:
    "Access our exclusive network of premium service providers including interior designers, property managers, legal advisors, and luxury lifestyle concierge services.",
}

const affiliateCategories = [
  {
    title: "Vetted Interior Designers",
    description: "Award-winning designers specializing in luxury coastal properties and high-end renovations.",
    icon: Palette,
    services: [
      "Full-service interior design",
      "Luxury furniture and decor sourcing",
      "Custom millwork and built-ins",
      "Art curation and placement",
      "Smart home integration design",
    ],
    partners: "25+ certified designers",
  },
  {
    title: "Trusted Property Managers",
    description: "Professional property management services for investment properties and vacation homes.",
    icon: Home,
    services: [
      "Full-service property management",
      "Vacation rental management",
      "Maintenance and repair coordination",
      "Tenant screening and placement",
      "Financial reporting and analysis",
    ],
    partners: "15+ management companies",
  },
  {
    title: "Premium Home Service Providers",
    description: "Elite contractors, landscapers, and maintenance professionals for all your property needs.",
    icon: Users,
    services: [
      "Licensed general contractors",
      "Landscape design and maintenance",
      "Pool and spa services",
      "Security system installation",
      "Luxury home automation",
    ],
    partners: "50+ service providers",
  },
  {
    title: "Legal and Financial Advisors",
    description: "Experienced professionals specializing in real estate law, tax planning, and wealth management.",
    icon: Scale,
    services: [
      "Real estate attorneys",
      "Tax planning specialists",
      "Wealth management advisors",
      "Estate planning attorneys",
      "1031 exchange facilitators",
    ],
    partners: "20+ certified professionals",
  },
  {
    title: "Luxury Lifestyle Concierge",
    description: "Exclusive concierge services to enhance your California coastal lifestyle experience.",
    icon: Crown,
    services: [
      "Private chef and catering services",
      "Yacht and boat charter arrangements",
      "Exclusive event planning",
      "Personal shopping and styling",
      "Travel and vacation planning",
    ],
    partners: "30+ luxury providers",
  },
]

const partnerBenefits = [
  {
    title: "Rigorous Vetting Process",
    description:
      "All partners undergo comprehensive background checks, licensing verification, and quality assessments.",
    icon: Shield,
    stat: "99.5% client satisfaction",
  },
  {
    title: "Exclusive Network Access",
    description: "Access to premium service providers who typically work by referral only.",
    icon: Network,
    stat: "150+ elite partners",
  },
  {
    title: "Preferred Pricing",
    description: "Special rates and priority scheduling for Crown Coastal Homes clients.",
    icon: DollarSign,
    stat: "10-20% savings",
  },
  {
    title: "Quality Guarantee",
    description: "We stand behind all our affiliate partners with our satisfaction guarantee.",
    icon: Award,
    stat: "100% guaranteed work",
  },
]

const successStories = [
  {
    service: "Interior Design",
    quote:
    "Where do I start! We received such an exceptional service from Reza every step of the way. He presented us with the best options and kept us informed with every development. Reza’s resources are top notch, we felt fully taken care of by the professionals he recommended us. Our neighbors were raving about the open house party they attended at our house. We couldn’t be more happier with the decision to trust our house with Reza.",
    author: "Jennifer & Michael Thompson",
    location: "Malibu, CA",
    project: "Complete home renovation",
    rating: 5,
  },
  {
    service: "Property Management",
    quote:
    "Reza was incredibly helpful in our home search and in securing our first house! He had knowledge about the area and was always responsive to our questions. He made our first time homeownership process very seamless and handled contact with the seller's agent easily. We highly recommend Reza as he treats his clients as if they were family and wants to make sure the best service is given to them. We really appreciate all his efforts and him being our agent for our first home!",
    author: "zuser20200608130554070",
    location: "Oceanside, CA",
    project: "Vacation rental management",
    rating: 5,
  },
  {
    service: "Legal Services",
    quote:
    "Reza is a true standout in the real estate world. His expertise and ability to navigate the market’s complexities while keeping us calm and well-informed were nothing short of remarkable. From expertly staging our home to negotiating the best possible offer, he made the entire selling process effortless and stress-free. His recommendations for contractors and stagers turned our home into an absolute showstopper. We wouldn’t think of working with anyone else for our future real estate needs!",
    author: "Mateo Torres",
    location: "San marcos, CA",
    project: "Estate planning and purchase",
    rating: 5,
  },
]

const partnershipProcess = [
  {
    step: 1,
    title: "Needs Assessment",
    description: "We discuss your specific requirements and preferences for service providers.",
  },
  {
    step: 2,
    title: "Partner Matching",
    description: "We recommend 2-3 pre-vetted partners who specialize in your type of project.",
  },
  {
    step: 3,
    title: "Introduction & Consultation",
    description: "We facilitate introductions and initial consultations with your selected partners.",
  },
  {
    step: 4,
    title: "Project Coordination",
    description: "We provide ongoing support and coordination throughout your project.",
  },
]

export default function AffiliatesPage() {
  return (
    <div className="bg-brand-californiaSand min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/modern-beach-house.png"
          alt="Luxury home interior with SOLD sign showcasing world-class affiliate services"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <Badge className="mb-4 bg-brand-goldenHour text-brand-midnightCove px-4 py-2 text-sm font-semibold">
            Exclusive Network
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-heading text-brand-white shadow-text">
            World-Class
            <span className="block text-brand-goldenHour drop-shadow-md">Affiliate Network</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto shadow-text leading-relaxed">
            Access our exclusive network of premium service providers, from interior designers to property managers and
            luxury lifestyle concierge services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4 text-lg"
            >
              <Users className="h-5 w-5 mr-2" />
              Explore Our Network
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-brand-white text-black hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4 text-lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Request Referral
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Affiliate Categories */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Our Premium Partner Network</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We've carefully curated relationships with the finest service providers in California's coastal markets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {affiliateCategories.map((category, index) => (
              <Card key={index} className="bg-brand-white shadow-medium hover:shadow-strong transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-brand-pacificTeal/10 rounded-lg p-3 mr-4">
                        <category.icon className="h-8 w-8 text-brand-pacificTeal" />
                      </div>
                      <CardTitle className="text-xl text-brand-midnightCove">{category.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {category.partners}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base mb-4 leading-relaxed">
                    {category.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {category.services.map((service, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-brand-pacificTeal mr-2 mt-0.5 flex-shrink-0" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Partner Benefits */}
        <section className="mb-20 bg-brand-white p-8 sm:p-12 rounded-xl shadow-medium">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Benefits of Our Affiliate Network
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the advantages of working with our carefully selected, premium service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnerBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-brand-sunsetBlush/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-brand-sunsetBlush" />
                </div>
                <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">{benefit.title}</h3>
                <p className="text-gray-600 mb-3">{benefit.description}</p>
                <div className="text-2xl font-bold text-brand-pacificTeal">{benefit.stat}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Partnership Process */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              How Our Referral Process Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple, streamlined process to connect you with the perfect service providers for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnershipProcess.map((step, index) => (
              <Card key={index} className="bg-brand-white shadow-medium text-center">
                <CardHeader>
                  <div className="bg-brand-sunsetBlush rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                    {step.step}
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

        {/* Success Stories */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Client Success Stories</h2>
            <p className="text-xl text-gray-600">See how our affiliate partners have delivered exceptional results.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-brand-white shadow-medium">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-brand-pacificTeal text-white">{story.service}</Badge>
                    <div className="flex">
                      {[...Array(story.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-brand-goldenHour fill-brand-goldenHour" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-gray-600 italic mb-6 leading-relaxed">"{story.quote}"</blockquote>
                  <div className="border-t border-brand-silverMist/50 pt-4">
                    <p className="font-semibold text-brand-graphitePeak">{story.author}</p>
                    <p className="text-sm text-gray-500 mb-1">{story.location}</p>
                    <p className="text-sm font-semibold text-brand-pacificTeal">{story.project}</p>
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
              <Sparkles className="h-16 w-16 text-brand-goldenHour mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Access Our Premium Network?</h2>
              <p className="text-xl text-brand-californiaSand/90 mb-8 max-w-2xl mx-auto">
                Connect with world-class service providers who understand the unique needs of luxury coastal properties.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Consultation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Request Partner Referral
                </Button>
              </div>
              <p className="text-sm text-brand-californiaSand/70 mt-6">
                All referrals come with our satisfaction guarantee and preferred client pricing.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
