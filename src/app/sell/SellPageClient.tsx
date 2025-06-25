"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  Clock,
  Users,
  Camera,
  FileText,
  Home,
  CheckCircle,
  Star,
  Calculator,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Award,
  Shield,
  Target,
} from "lucide-react"
import Link from "next/link"

const sellingProcess = [
  {
    step: 1,
    title: "Comprehensive Property Evaluation",
    description:
      "We conduct a detailed market analysis to determine your property's optimal listing price and positioning strategy.",
    icon: Calculator,
    details: "Our certified appraisers use advanced analytics and local market data to provide accurate valuations.",
  },
  {
    step: 2,
    title: "Professional Marketing Strategy",
    description:
      "We create a customized marketing plan featuring professional photography, digital marketing, and targeted outreach.",
    icon: Camera,
    details: "Includes high-resolution photography, virtual tours, and placement on premium listing platforms.",
  },
  {
    step: 3,
    title: "Expert Negotiation & Management",
    description:
      "Our experienced agents handle all negotiations and manage the entire transaction process on your behalf.",
    icon: FileText,
    details: "We review all offers, negotiate terms, and coordinate inspections and appraisals.",
  },
  {
    step: 4,
    title: "Seamless Transaction Closing",
    description:
      "We guide you through every step of the closing process, ensuring all documentation is properly handled.",
    icon: Home,
    details: "Complete support through escrow, final walkthrough, and key transfer.",
  },
]

const serviceAdvantages = [
  {
    title: "Proven Market Expertise",
    description: "Over 15 years of experience in California's coastal real estate markets with deep local knowledge.",
    icon: Award,
    stats: "500+ successful transactions",
  },
  {
    title: "Comprehensive Marketing Approach",
    description:
      "Multi-channel marketing strategy including digital platforms, print media, and professional networks.",
    icon: Target,
    stats: "98% of listings receive offers",
  },
  {
    title: "Dedicated Client Service",
    description: "Personal attention from experienced agents who are committed to achieving your real estate goals.",
    icon: Users,
    stats: "24/7 client support",
  },
  {
    title: "Transparent Process",
    description: "Clear communication and regular updates throughout the entire selling process with no hidden fees.",
    icon: Shield,
    stats: "100% fee transparency",
  },
]

const clientTestimonials = [
  {
    quote:
      "Reza is a true standout in the real estate world. His expertise and ability to navigate the market’s complexities while keeping us calm and well-informed were nothing short of remarkable. From expertly staging our home to negotiating the best possible offer, he made the entire selling process effortless and stress-free. His recommendations for contractors and stagers turned our home into an absolute showstopper. We wouldn’t think of working with anyone else for our future real estate needs!.",
    author: "Mateo Torres",
    location: "San marcos, CA",
    salePrice: "$1.495M",
    rating: 5,
    timeframe: "Sold in 55 days",
  },
  {
    quote: "Recently sold my home, and I couldn’t be more grateful for the outstanding work my real estate agent did throughout the entire process. From our first meeting to closing day, they were professional, knowledgeable, and truly dedicated to getting the best outcome for me. They provided expert advice on pricing, staging, and marketing, and their strategy brought in strong interest right away. Communication was consistent and clear, and I always felt like I was in good hands. They went above and beyond, handling every detail with care and making what could have been a stressful process feel smooth and manageable. Thanks to their expertise and hard work, my home sold quickly and at a great price. I highly recommend Reza Barghlameno to anyone looking to buy or sell a home—you won’t be disappointed!",
    author: "jacoboenter",
    location: "La sierra acres, Riverside, CA",
    salePrice: "$880K",
    rating: 5,
    timeframe: "Sold in 28 days",
  },
  {
    quote: "My husband and I are first time buyers in San Diego which, as those of us fortunate enough to live here know, has one of the most expensive and competitive housing markets in the nation. We came into this process with very high hopes and very little knowledge. From the moment we met him, Reza has been helpful, understanding, patient, professional, empathetic, and has operated with the highest level of integrity. Our experience was a difficult one, and Reza did a phenomenal job of managing our expectations without squashing our excitement. He helped us maintain our momentum through frustrating loses, and allowed us the space and humanity to grieve when things did not turn out in the ways we expected it. Reza stuck through a huge amount of hurdles with us over the last 7 months. We had the *pleasure* of entering escrow twice during our hunt for the perfect house. The first time we entered escrow was for a house that had a deed attached to it. It was not until after we had entered escrow that Reza discovered there was a significant limit placed on the total annual family income for this house (something both the sellers AND the city of San Marcos were unaware of at the time) that made our family ineligible to live there. He fought for our family, going as far as meeting with a representative of the City of San Marcos at town hall to determine what the issue was with our purchasing of this property. Reza kept us updated both by text and over the phone during every step, and was able to explain the issues at hand in language that allowed us to understand the legalities and complications. He helped us navigate exiting escrow, and grieved with us when our disappointment became overwhelming. The second house we entered escrow (which is now our family home) also had a arduous process that Reza helped us navigate. We had so many issues arise that were completely out of ours, and his, hands; he tackled each one with professionalism and never gave up on our family. We have navigated issues with the seller, disappointing inspection results, a canceled loan, issues with the title that resulted in the loss of our investor, issues with expired HOA documents, and more. The number of times we thought we were going to have to restart this process was overwhelming, but with each new challenge, Reza helped keep us level-headed, fought for us, and found creative ways to work around and through them. His diligence has allowed us to find the home that we are excited to raise our children in, and a community in which we can thrive. In the future, we look forward to working with Reza again, and will continue to recommend him to anyone and everyone we meet that is also going through this process. Purchasing a home is a very frustrating process, and is definitely not for the weak. Knowing that there are people like Reza out there makes it just that much better, safer, enjoyable, and helpful. Thank you, Reza, for all that you have done for our family. We can't wait to have you over for dinner once we are moved in!",
    author: "Maxim Gantman",
    location: "Escondido, CA",
    salePrice: "$515K",
    rating: 5,
    timeframe: "Sold in 100 days",
  },
]

const marketPerformance = [
  { label: "Average Sale Price", value: "$2.1M", change: "+8.5% Year-over-Year", icon: TrendingUp },
  { label: "Properties Successfully Sold", value: "500+", change: "In the past 12 months", icon: Home },
  { label: "Average Days on Market", value: "28", change: "17 days below market average", icon: Clock },
  { label: "Sale-to-List Price Ratio", value: "102%", change: "Above asking price average", icon: Target },
]

const frequentlyAskedQuestions = [
  {
    question: "How do you determine the optimal listing price for my property?",
    answer:
      "We conduct a comprehensive Comparative Market Analysis (CMA) that examines recent sales of similar properties in your area, current market conditions, and your property's unique features. Our pricing strategy considers both current market value and optimal positioning to attract qualified buyers while maximizing your return.",
  },
  {
    question: "What are your commission rates and fee structure?",
    answer:
      "Our commission structure is competitive and transparent, varying based on property value and required services. We provide a detailed breakdown of all costs upfront, including marketing expenses, and offer flexible commission options for luxury properties. There are no hidden fees, and all costs are clearly outlined in our listing agreement.",
  },
  {
    question: "What is the typical timeline for selling a property?",
    answer:
      "Our average time on market is 28 days, significantly faster than the regional average of 45 days. However, the timeline can vary based on factors such as property type, location, pricing strategy, market conditions, and seasonal trends. We provide realistic timeline expectations during our initial consultation.",
  },
  {
    question: "Do you provide professional staging and photography services?",
    answer:
      "Yes, we offer comprehensive staging consultation and work with certified staging professionals. Our marketing package includes professional photography, virtual tours, and drone footage when appropriate. For luxury properties, staging services are often included as part of our comprehensive marketing strategy.",
  },
  {
    question: "What marketing strategies do you employ to sell properties?",
    answer:
      "Our marketing approach includes professional photography and virtual tours, premium online listings on major platforms, targeted social media campaigns, print advertising in luxury publications, email marketing to our qualified buyer database, and promotion through our professional network. We customize the marketing strategy based on your property's unique characteristics.",
  },
  {
    question: "Can you assist with simultaneous buying and selling transactions?",
    answer:
      "Absolutely. We specialize in coordinating simultaneous transactions and can provide various solutions including bridge financing options, strategic contingency planning, and timeline coordination. Our team works to minimize stress and ensure smooth transitions between properties.",
  },
  {
    question: "What support do you provide during the closing process?",
    answer:
      "We provide comprehensive support throughout the entire closing process, including coordination with escrow companies, title companies, and other professionals. We review all documentation, facilitate inspections and appraisals, and ensure all contractual obligations are met. Our team remains available to address any questions or concerns until the transaction is complete.",
  },
]

export default function SellPageClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    propertyType: "",
    timeframe: "",
    currentValue: "",
    message: "",
  })

  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Property valuation request submitted:", formData)
    setFormSubmitted(true)
    // Handle form submission - in real app, this would send to backend
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-brand-californiaSand pt-20 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[75vh] min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/california-coastal-sunset.png"
          alt="Elegant luxury home with professional 'For Sale' signage"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-heading text-brand-white shadow-text">
            Professional Real Estate Services
            <span className="block text-brand-goldenHour drop-shadow-md">for California Coastal Properties</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 text-gray-100 max-w-3xl mx-auto shadow-text leading-relaxed">
            Partner with experienced professionals to achieve optimal results for your property sale. We provide
            comprehensive market analysis, strategic marketing, and expert negotiation services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-10 py-4 text-lg font-semibold"
              onClick={() => document.getElementById("valuation-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Calculator className="h-5 w-5 mr-2" />
              Request Property Valuation
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-brand-white text-black hover:bg-brand-white hover:text-brand-midnightCove px-10 py-4 text-lg font-semibold"
              onClick={() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Phone className="h-5 w-5 mr-2" />
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Market Performance Section */}
      <section className="py-20 bg-brand-midnightCove text-brand-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Market Performance & Results</h2>
            <p className="text-xl text-brand-californiaSand/90 max-w-3xl mx-auto">
              Our proven track record demonstrates consistent success in California's competitive coastal real estate
              markets.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {marketPerformance.map((metric, index) => (
              <Card key={index} className="bg-brand-white/10 border-brand-white/20 text-center">
                <CardContent className="pt-6">
                  <metric.icon className="h-12 w-12 text-brand-goldenHour mx-auto mb-4" />
                  <div className="text-4xl md:text-5xl font-bold text-brand-goldenHour mb-2">{metric.value}</div>
                  <div className="text-brand-californiaSand/90 text-lg mb-2 font-semibold">{metric.label}</div>
                  <div className="text-brand-californiaSand/70 text-sm">{metric.change}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        {/* Service Advantages Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Why Choose Crown Coastal Homes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We combine extensive market knowledge with innovative marketing strategies and personalized service to
              deliver exceptional results for our clients.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceAdvantages.map((advantage, index) => (
              <Card key={index} className="bg-brand-white shadow-medium hover:shadow-strong transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="bg-brand-pacificTeal/10 rounded-lg p-3 mr-4">
                      <advantage.icon className="h-8 w-8 text-brand-pacificTeal" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-brand-midnightCove">{advantage.title}</CardTitle>
                      <div className="text-sm text-brand-pacificTeal font-semibold">{advantage.stats}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {advantage.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Selling Process Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Our Professional Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic, four-phase approach designed to maximize your property's value and ensure a smooth
              transaction.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sellingProcess.map((step, index) => (
              <Card key={index} className="bg-brand-white shadow-medium">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="relative mr-6">
                      <div className="bg-brand-sunsetBlush rounded-full w-16 h-16 flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-white" />
                      </div>

                    </div>
                    <div>
                      <CardTitle className="text-xl text-brand-midnightCove">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base mb-3 leading-relaxed">
                    {step.description}
                  </CardDescription>
                  <p className="text-sm text-gray-500 italic">{step.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Property Valuation Form Section */}
        <section id="valuation-form" className="mb-20">
          <Card className="bg-brand-white shadow-strong">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-4">
                Request Your Complimentary Property Valuation
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Receive a comprehensive market analysis of your property's current value, including comparable sales
                data, market trends, and strategic pricing recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div>
                  <h3 className="text-2xl font-semibold text-brand-midnightCove mb-6">What You'll Receive:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-brand-pacificTeal mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800">Detailed Market Analysis</span>
                        <p className="text-gray-600 text-sm">
                          Comprehensive evaluation based on recent comparable sales
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-brand-pacificTeal mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800">Strategic Pricing Recommendations</span>
                        <p className="text-gray-600 text-sm">Optimal pricing strategy for current market conditions</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-brand-pacificTeal mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800">No-Obligation Consultation</span>
                        <p className="text-gray-600 text-sm">Professional advice with no commitment required</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-brand-pacificTeal mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800">Personalized Marketing Strategy</span>
                        <p className="text-gray-600 text-sm">Customized approach for your specific property</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-xl">
                  {!formSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="propertyType" className="text-sm font-semibold text-gray-700">
                            Property Type
                          </Label>
                          <Select onValueChange={(value) => handleChange("propertyType", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single-family">Single Family Residence</SelectItem>
                              <SelectItem value="condo">Condominium</SelectItem>
                              <SelectItem value="townhouse">Townhouse</SelectItem>
                              <SelectItem value="multi-family">Multi-Family Property</SelectItem>
                              <SelectItem value="land">Land/Vacant Lot</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                          Property Address *
                        </Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                          placeholder="Street address, city, state, ZIP code"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="timeframe" className="text-sm font-semibold text-gray-700">
                            Preferred Timeline
                          </Label>
                          <Select onValueChange={(value) => handleChange("timeframe", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="When would you like to sell?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediately</SelectItem>
                              <SelectItem value="3-months">Within 3 months</SelectItem>
                              <SelectItem value="6-months">Within 6 months</SelectItem>
                              <SelectItem value="1-year">Within 1 year</SelectItem>
                              <SelectItem value="exploring">Exploring options</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="currentValue" className="text-sm font-semibold text-gray-700">
                            Estimated Property Value
                          </Label>
                          <Select onValueChange={(value) => handleChange("currentValue", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Estimated current value" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under-500k">Under $500,000</SelectItem>
                              <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                              <SelectItem value="1m-2m">$1,000,000 - $2,000,000</SelectItem>
                              <SelectItem value="2m-5m">$2,000,000 - $5,000,000</SelectItem>
                              <SelectItem value="over-5m">Over $5,000,000</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
                          Additional Information
                        </Label>
                        <Textarea
                          id="message"
                          rows={4}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="Please share any unique features, recent improvements, or specific goals for your property sale..."
                          className="mt-1"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white py-3 text-sm sm:text-sm font-semibold"
                      >
                        Request Complimentary Valuation
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        By submitting this form, you agree to be contacted by our team regarding your property.
                      </p>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-brand-pacificTeal mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-brand-midnightCove mb-2">Thank You!</h3>
                      <p className="text-gray-600 mb-4">
                        Your valuation request has been submitted successfully. One of our experienced agents will
                        contact you within 24 hours.
                      </p>
                      <Button
                        onClick={() => setFormSubmitted(false)}
                        variant="outline"
                        className="border-brand-pacificTeal text-brand-pacificTeal"
                      >
                        Submit Another Request
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Client Testimonials Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Client Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Read testimonials from satisfied clients who achieved exceptional results with our professional services.
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
                  <MessageSquare className="h-8 w-8 text-brand-pacificTeal/30 mb-3" />
                </CardHeader>
                <CardContent>
                  <blockquote className="text-gray-600 italic mb-6 leading-relaxed">"{testimonial.quote.substring(0, 300)}..."</blockquote>
                  <div className="border-t border-brand-silverMist/50 pt-4">
                    <p className="font-semibold text-brand-graphitePeak">{testimonial.author}</p>
                    <p className="text-sm text-gray-500 mb-2">{testimonial.location}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-brand-pacificTeal">{testimonial.salePrice}</span>
                      <span className="text-gray-500">{testimonial.timeframe}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact-section" className="mb-20">
          <Card className="bg-brand-white shadow-strong">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-4">
                Ready to Begin Your Property Sale?
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 max-w-3xl mx-auto">
                Contact our experienced team to discuss your real estate goals and learn how we can help you achieve
                optimal results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
                <div className="p-6">
                  <Phone className="h-12 w-12 text-brand-pacificTeal mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">Phone Consultation</h3>
                  <p className="text-gray-600 mb-3 text-sm">Speak directly with a licensed agent</p>
                  <a href="tel:+15551234567" className="text-brand-pacificTeal hover:underline font-semibold text-lg">
                  1 858-305-4362


                  </a>
                </div>
                <div className="p-6">
                  <Mail className="h-12 w-12 text-brand-pacificTeal mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">Email Inquiry</h3>
                  <p className="text-gray-600 mb-3 text-sm">Receive detailed information via email</p>
                  <a
                    href="mailto:sell@crowncoastalhomes.com"
                    className="text-brand-pacificTeal hover:underline font-semibold"
                  >
                   reza@crowncoastal.com
                  </a>
                </div>
                <div className="p-6">
                  <MapPin className="h-12 w-12 text-brand-pacificTeal mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">Office Visit</h3>
                  <p className="text-gray-600 mb-3 text-sm">Schedule an in-person consultation</p>
                  <p className="text-brand-pacificTeal font-semibold">CA DRE #02211952</p>
                </div>
                {/* <div className="p-6">
                  <FileText className="h-12 w-12 text-brand-pacificTeal mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brand-midnightCove mb-2">Free Resources</h3>
                  <p className="text-gray-600 mb-3 text-sm">Download helpful guides and checklists</p>
                  <Link href="/sell/resources" className="text-brand-pacificTeal hover:underline font-semibold">
                    Browse Resources
                  </Link>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section>
          <Card className="bg-brand-white shadow-medium">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-4">
                Frequently Asked Questions
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Find answers to common questions about our property selling services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {frequentlyAskedQuestions.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg text-left hover:text-brand-pacificTeal text-brand-graphitePeak font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2 text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
