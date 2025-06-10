import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Star,
  TrendingUp,
  Calculator,
  PieChart,
  Building,
  Scale,
  Phone,
  Mail,
  Calendar,
  Target,
  Shield,
  Award,
  DollarSign,
  BarChart3,
} from "lucide-react"
import CustomerReview from "@/components/customer-review"

export const metadata: Metadata = {
  title: "Investment Management Services | Crown Coastal Homes",
  description:
    "Expert guidance on California coastal real estate investments. Market analysis, ROI projections, portfolio diversification, and comprehensive property management solutions.",
}

const investmentServices = [
  {
    title: "Market Analysis and Trends",
    description: "Comprehensive analysis of California coastal real estate markets with detailed trend forecasting.",
    icon: TrendingUp,
    features: [
      "Local market trend analysis",
      "Comparative market studies",
      "Economic impact assessments",
      "Future growth projections",
      "Seasonal market variations",
    ],
  },
  {
    title: "ROI Projections",
    description: "Detailed return on investment calculations and financial modeling for potential properties.",
    icon: Calculator,
    features: [
      "Cash flow analysis",
      "Appreciation projections",
      "Tax benefit calculations",
      "Risk assessment modeling",
      "Break-even analysis",
    ],
  },
  {
    title: "Portfolio Diversification Strategies",
    description: "Strategic guidance on building a balanced real estate investment portfolio across different markets.",
    icon: PieChart,
    features: [
      "Asset allocation strategies",
      "Geographic diversification",
      "Property type mix optimization",
      "Risk tolerance assessment",
      "Investment timeline planning",
    ],
  },
  {
    title: "Property Management Solutions",
    description: "Comprehensive property management services to maximize your investment returns.",
    icon: Building,
    features: [
      "Tenant screening and placement",
      "Rent collection and accounting",
      "Maintenance coordination",
      "Property inspections",
      "Financial reporting",
    ],
  },
  {
    title: "Tax and Legal Considerations",
    description: "Expert guidance on tax implications and legal structures for real estate investments.",
    icon: Scale,
    features: [
      "1031 exchange facilitation",
      "Tax optimization strategies",
      "Legal structure recommendations",
      "Depreciation planning",
      "Estate planning integration",
    ],
  },
]

const investmentBenefits = [
  {
    title: "Proven Track Record",
    description: "Consistent investment performance with average annual returns exceeding market benchmarks.",
    icon: Award,
    stat: "12.5% Avg. Annual Return",
  },
  {
    title: "Asset Management",
    description: "Sophisticated risk assessment and mitigation strategies to protect your investments.",
    icon: Shield,
    stat: "100% Portfolio Protection",
  },
  {
    title: "Market Expertise",
    description: "Deep knowledge of California coastal markets and investment opportunities.",
    icon: Target,
    stat: "15+ Years Experience",
  },
  {
    title: "Comprehensive Service",
    description: "End-to-end investment management from acquisition to disposition.",
    icon: BarChart3,
    stat: "Full-Service Solutions",
  },
]

const investmentTypes = [
  {
    type: "Single-Family Rentals",
    description: "High-quality rental properties in desirable coastal neighborhoods.",
    benefits: ["Steady cash flow", "Long-term appreciation", "Tax advantages"],
    avgReturn: "8-12% annually",
  },
  {
    type: "Vacation Rentals",
    description: "Short-term rental properties in prime tourist destinations.",
    benefits: ["Higher rental yields", "Personal use option", "Seasonal flexibility"],
    avgReturn: "12-18% annually",
  },
  {
    type: "Multi-Family Properties",
    description: "Apartment buildings and multi-unit properties for diversified income.",
    benefits: ["Multiple income streams", "Economies of scale", "Professional management"],
    avgReturn: "10-15% annually",
  },
  {
    type: "Commercial Real Estate",
    description: "Office buildings, retail spaces, and mixed-use developments.",
    benefits: ["Long-term leases", "Triple net options", "Inflation protection"],
    avgReturn: "7-11% annually",
  },
]

const marketInsights = [
  {
    metric: "Coastal Appreciation",
    value: "+8.5%",
    description: "Average annual appreciation in coastal California markets",
    trend: "positive",
  },
  {
    metric: "Rental Yield",
    value: "4.2%",
    description: "Average gross rental yield for coastal properties",
    trend: "positive",
  },
  {
    metric: "Vacancy Rate",
    value: "3.1%",
    description: "Current vacancy rate in premium coastal markets",
    trend: "positive",
  },
  {
    metric: "Market Stability",
    value: "High",
    description: "Market stability rating based on economic indicators",
    trend: "positive",
  },
]

const clientSuccessStories = [
  {
    quote:
      "Crown Coastal's investment team helped me build a portfolio of 5 rental properties that now generates $15,000 monthly passive income. Their market analysis was spot-on.",
    author: "Robert Chen, Real Estate Investor",
    location: "San Diego Portfolio",
    investment: "$2.8M Portfolio Value",
    return: "14.2% Annual Return",
    rating: 5,
  },
  {
    quote:
      "The vacation rental strategy they developed for my Malibu property has exceeded all expectations. Professional management and excellent returns.",
    author: "Jennifer Martinez, Property Owner",
    location: "Malibu, CA",
    investment: "$3.5M Beachfront Property",
    return: "16.8% Annual Return",
    rating: 5,
  },
  {
    quote:
      "Their 1031 exchange expertise saved me significant taxes while upgrading to a better investment property. Truly comprehensive service.",
    author: "David Thompson, Business Owner",
    location: "Newport Beach, CA",
    investment: "$4.2M Exchange",
    return: "Tax savings + appreciation",
    rating: 5,
  },
]

const investmentProcess = [
  {
    step: 1,
    title: "Investment Consultation",
    description: "Comprehensive review of your investment goals, risk tolerance, and financial situation.",
  },
  {
    step: 2,
    title: "Market Analysis",
    description: "Detailed analysis of target markets and identification of optimal investment opportunities.",
  },
  {
    step: 3,
    title: "Property Selection",
    description: "Careful selection of properties that meet your investment criteria and return expectations.",
  },
  {
    step: 4,
    title: "Due Diligence",
    description: "Thorough property analysis including inspections, financial review, and risk assessment.",
  },
  {
    step: 5,
    title: "Acquisition Support",
    description: "Complete transaction management from offer negotiation through closing.",
  },
  {
    step: 6,
    title: "Ongoing Management",
    description: "Continuous portfolio monitoring and optimization to maximize returns.",
  },
]

export default function InvestmentPage() {
  return (
    <div className="bg-brand-californiaSand min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/modern-ocean-house.png"
          alt="Successful real estate investors with SOLD sign celebrating investment property acquisition"
          fill
          className="object-cover object-right"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-left">
          <Badge className="mb-4 bg-brand-goldenHour text-brand-midnightCove px-4 py-2 text-sm font-semibold">
            Investment Specialists
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-heading text-brand-white text-center shadow-text">
            Investment Management
            Services
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl ml-auto shadow-text leading-relaxed">
            Expert guidance on property investments with comprehensive support for maximizing your real estate portfolio
            returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4 text-lg"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Explore Investment Options
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-brand-white text-black hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4 text-lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Speak with Advisor
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Market Insights */}
        <section className="mb-20 bg-brand-midnightCove text-brand-white p-8 sm:p-12 rounded-xl shadow-strong">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Current Market Insights</h2>
            <p className="text-xl text-brand-californiaSand/90 max-w-3xl mx-auto">
              Key metrics and trends in California's coastal real estate investment markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {marketInsights.map((insight, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-brand-goldenHour mb-2">{insight.value}</div>
                <div className="text-brand-californiaSand/90 text-lg mb-2 font-semibold">{insight.metric}</div>
                <div className="text-brand-californiaSand/70 text-sm">{insight.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Investment Services */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Comprehensive Investment Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our investment management services provide expert guidance throughout your entire real estate investment
              journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {investmentServices.map((service, index) => (
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

        {/* Investment Types */}
        <section className="mb-20 bg-brand-white p-8 sm:p-12 rounded-xl shadow-medium">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Investment Opportunities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore different types of real estate investments available in California's coastal markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {investmentTypes.map((type, index) => (
              <Card key={index} className="bg-brand-californiaSand/30 shadow-subtle">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-lg text-brand-midnightCove">{type.type}</CardTitle>
                    <Badge className="bg-brand-sunsetBlush text-white">{type.avgReturn}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4 leading-relaxed">{type.description}</CardDescription>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-brand-pacificTeal mr-2 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Investment Process */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Our Investment Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach to identifying, acquiring, and managing profitable real estate investments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentProcess.map((step, index) => (
              <Card key={index} className="bg-brand-white shadow-medium">
                <CardHeader>
                <div className="bg-brand-sunsetBlush rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg">
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

        {/* Benefits */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">
              Why Choose Our Investment Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the advantages of working with seasoned real estate investment professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {investmentBenefits.map((benefit, index) => (
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

        {/* Success Stories */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-midnightCove mb-6">Investment Success Stories</h2>
            <p className="text-xl text-gray-600">See how our clients have achieved exceptional investment returns.</p>
          </div>

            <CustomerReview />
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-brand-midnightCove text-brand-white shadow-strong">
            <CardContent className="p-12 text-center">
              <DollarSign className="h-16 w-16 text-brand-goldenHour mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Build Your Investment Portfolio?</h2>
              <p className="text-xl text-brand-californiaSand/90 mb-8 max-w-2xl mx-auto">
                Let our investment specialists help you identify and acquire profitable real estate investments in
                California's premier coastal markets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-4">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Investment Consultation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-midnightCove px-8 py-4"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Download Investment Guide
                </Button>
              </div>
              <p className="text-sm text-brand-californiaSand/70 mt-6">
                Complimentary consultation includes market analysis and investment opportunity assessment.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
