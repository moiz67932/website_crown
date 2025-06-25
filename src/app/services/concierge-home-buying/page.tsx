import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Star,
  Clock,
  Shield,
  Home,
  Search,
  FileText,
  Key,
  Phone,
  Mail,
  Calendar,
  Award,
  Target,
  Heart,
} from "lucide-react"
import CustomerReview from "@/components/customer-review"

export const metadata: Metadata = {
  title: "Concierge Home Buying Services | Crown Coastal Homes",
  description:
    "Experience white-glove home buying services in California. Personalized property selection, private viewings, expert negotiation, and complete transaction management.",
}

const conciergeServices = [
  {
    title: "Personalized Property Selection",
    description: "Curated property recommendations based on your specific lifestyle preferences and requirements.",
    icon: Search,
    details: [
      "Detailed lifestyle and preference consultation",
      "Custom property matching algorithm",
      "Off-market and exclusive listing access",
      "Comprehensive property research and analysis",
    ],
  },
  {
    title: "Private Viewings",
    description: "Exclusive, private showings scheduled at your convenience with dedicated agent accompaniment.",
    icon: Key,
    details: [
      "Flexible scheduling including evenings and weekends",
      "Private access to luxury properties",
      "Detailed property walkthroughs with expert insights",
      "Virtual tour options for remote clients",
    ],
  },
  {
    title: "Negotiation Expertise",
    description: "Professional negotiation services to secure the best possible terms and pricing for your purchase.",
    icon: Target,
    details: [
      "Market analysis and pricing strategy",
      "Professional offer preparation and presentation",
      "Skilled negotiation of terms and contingencies",
      "Multiple offer situation management",
    ],
  },
  {
    title: "Transaction Management",
    description: "Complete oversight of all transaction details from contract to closing.",
    icon: FileText,
    details: [
      "Contract review and explanation",
      "Inspection and appraisal coordination",
      "Escrow and title company liaison",
      "Timeline management and milestone tracking",
    ],
  },
  {
    title: "Post-Purchase Support",
    description: "Continued assistance after closing to ensure a smooth transition to your new home.",
    icon: Home,
    details: [
      "Utility setup and transfer assistance",
      "Local service provider recommendations",
      "Warranty and maintenance guidance",
      "Ongoing client relationship management",
    ],
  },
]

const processSteps = [
  {
    step: 1,
    title: "Initial Consultation",
    description: "Comprehensive discussion of your needs, preferences, timeline, and budget.",
    duration: "1-2 hours",
  },
  {
    step: 2,
    title: "Property Curation",
    description: "Custom selection of properties matching your criteria, including exclusive listings.",
    duration: "Ongoing",
  },
  {
    step: 3,
    title: "Private Showings",
    description: "Scheduled private viewings with detailed property analysis and market insights.",
    duration: "As needed",
  },
  {
    step: 4,
    title: "Offer Strategy",
    description: "Development of competitive offer strategy and professional negotiation.",
    duration: "1-3 days",
  },
  {
    step: 5,
    title: "Transaction Management",
    description: "Complete oversight of escrow, inspections, and closing process.",
    duration: "30-45 days",
  },
  {
    step: 6,
    title: "Post-Closing Support",
    description: "Continued assistance with move-in and local area orientation.",
    duration: "Ongoing",
  },
]

const clientBenefits = [
  {
    title: "Time Savings",
    description: "We handle all research, scheduling, and coordination, saving you valuable time.",
    icon: Clock,
    stat: "Save 40+ hours",
  },
  {
    title: "Exclusive Access",
    description: "Access to off-market properties and exclusive listings not available to the public.",
    icon: Star,
    stat: "30% more options with off market opportunities",
  },
  {
    title: "Expert Guidance",
    description: "Professional advice throughout the entire process from experienced agents.",
    icon: Award,
    stat: "15+ years experience",
  },
  {
    title: "Stress-Free Experience",
    description: "Complete transaction management ensures a smooth, worry-free buying process.",
    icon: Shield,
    stat: "99% client satisfaction",
  },
]

const testimonials = [
  {
    quote:
      "Where do I start! We received such an exceptional service from Reza every step of the way. He presented us with the best options and kept us informed with every development. Reza’s resources are top notch, we felt fully taken care of by the professionals he recommended us. Our neighbors were raving about the open house party they attended at our house. We couldn’t be more happier with the decision to trust our house with Reza.",
    author: "Michael & Sarah Chen",
    location: "Vista, CA",
    property: "$1.035M 1995 Casablanca Ct, Vista, CA",
    rating: 5,
  },
  {
    quote:
      "Reza was incredibly helpful in our home search and in securing our first house! He had knowledge about the area and was always responsive to our questions. He made our first time homeownership process very seamless and handled contact with the seller's agent easily. We highly recommend Reza as he treats his clients as if they were family and wants to make sure the best service is given to them. We really appreciate all his efforts and him being our agent for our first home!",
    author: "zuser20200608130554070",
    location: "Oceanside, CA",
    property: "$880K 375 Ventasso Way Fallbrook, CA",
    rating: 5,
  },
  {
    quote:
      "Reza is a true standout in the real estate world. His expertise and ability to navigate the market’s complexities while keeping us calm and well-informed were nothing short of remarkable. From expertly staging our home to negotiating the best possible offer, he made the entire selling process effortless and stress-free. His recommendations for contractors and stagers turned our home into an absolute showstopper. We wouldn’t think of working with anyone else for our future real estate needs!",
    author: "Mateo Torres",
    location: "San marcos, CA",
    property: "$1.495M 708 Pascali Ct San Marcos, CA, 92069",
    rating: 5,
  },
]

export default function ConciergeBuyingPage() {
  return (
    <div className="bg-brand-californiaSand pt-20 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/modern-ocean-house.png"
          alt="Happy couple receiving keys to their new home with professional concierge service"
          fill
          className="object-cover object-left"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-left">
          <Badge className="mb-4 bg-brand-goldenHour text-brand-midnightCove px-4 py-2 text-sm font-semibold">
            Premium Service
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-heading text-brand-white shadow-text">
            Concierge Home Buying
            Services
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl shadow-text leading-relaxed">
            Experience white-glove service throughout your entire home buying journey, from property selection to
            closing and beyond.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4 text-lg"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Consultation
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-brand-white text-black hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4 text-lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call (555) 123-4567
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Service Overview */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Comprehensive Concierge Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our concierge home buying service provides personalized, white-glove assistance throughout your entire
              property acquisition journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {conciergeServices.map((service, index) => (
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
                    {service.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-brand-pacificTeal mr-2 mt-0.5 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Process Timeline */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Our Concierge Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach designed to make your home buying experience seamless and stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, index) => (
              <Card key={index} className="bg-brand-white shadow-medium relative">
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

        {/* Client Benefits */}
        <section className="mb-20 bg-brand-white p-8 sm:p-12 rounded-xl shadow-medium">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Why Choose Our Concierge Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the advantages of professional, personalized home buying assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {clientBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                  <div className="bg-brand-pacificTeal/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-brand-pacificTeal" />
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
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Client Success Stories</h2>
            <p className="text-xl text-gray-600">Hear from clients who experienced our concierge service firsthand.</p>
          </div>

            <CustomerReview />
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-brand-midnightCove text-brand-white shadow-strong">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-brand-goldenHour mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience Concierge Service?</h2>
              <p className="text-xl text-brand-californiaSand/90 mb-8 max-w-2xl mx-auto">
                Let our experienced team handle every detail of your home purchase while you focus on what matters most.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Free Consultation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Request Information
                </Button>
              </div>
              <p className="text-sm text-brand-californiaSand/70 mt-6">
                Contact us today to learn more about our exclusive concierge home buying services.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
