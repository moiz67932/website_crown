import { Landmark, Sun, Users, Briefcase, Waves, Anchor, TrendingUp, HomeIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface Neighborhood {
  name: string
  description: string
  href: string
  image?: string
}

export interface NeighborhoodCategory {
  name: string
  neighborhoods: Neighborhood[]
}

export interface Fact {
  icon: LucideIcon
  title: string
  value: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface MarketTrend {
  metric: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export interface CityTestimonial {
  quote: string
  author: string
  location: string // e.g., "La Jolla Resident" or "Downtown Buyer"
  rating: number // 1-5 stars
}

export interface CityData {
  id: string
  name: string
  fullName: string
  heroImage: string
  heroTitle: string
  heroSubtitle: string
  introText: string
  mapPlaceholderImage: string
  neighborhoodCategories: NeighborhoodCategory[]
  facts: Fact[]
  faqs: FAQItem[]
  marketTrends?: MarketTrend[]
  testimonials?: CityTestimonial[]
  metaTitle: string
  metaDescription: string
}

const sanDiegoData: CityData = {
  id: "san-diego",
  name: "San Diego",
  fullName: "San Diego, California",
  heroImage: "/san-diego-bay-sunset.png",
  heroTitle: "Discover San Diego",
  heroSubtitle: "Sun, surf, and vibrant city life await in America's Finest City.",
  introText:
    "San Diego, renowned for its idyllic climate, 70 miles of pristine beaches, and a dazzling array of world-class family attractions, offers a unique blend of urban sophistication and laid-back California cool. From the historic Gaslamp Quarter to the surf-friendly shores of La Jolla, San Diego provides a diverse range of lifestyles and communities. Whether you're seeking a bustling downtown condo, a tranquil suburban home, or a luxurious beachfront estate, Crown Coastal Homes can help you find your perfect property in this sun-kissed paradise.",
  mapPlaceholderImage: "/san-diego-neighborhoods-map.png",
  neighborhoodCategories: [
    {
      name: "Coastal Communities",
      neighborhoods: [
        {
          name: "La Jolla",
          description: "Upscale village with stunning coastline, boutiques, and fine dining.",
          href: "/buy/san-diego/la-jolla",
          image: "/la-jolla-cove.png",
        },
        {
          name: "Pacific Beach",
          description: "Lively beach town known for its boardwalk, surf scene, and nightlife.",
          href: "/buy/san-diego/pacific-beach",
          image: "/pacific-beach-pier.png",
        },
        {
          name: "Ocean Beach",
          description: "Bohemian beach town with a historic pier and dog-friendly beach.",
          href: "/buy/san-diego/ocean-beach",
          image: "/ocean-beach-pier-san-diego.png",
        },
        {
          name: "Coronado",
          description: "Charming island city with iconic Hotel del Coronado and beautiful beaches.",
          href: "/buy/san-diego/coronado",
          image: "/hotel-del-coronado.png",
        },
        {
          name: "Del Mar",
          description: "Affluent coastal town famous for its racetrack and beautiful beaches.",
          href: "/buy/san-diego/del-mar",
          image: "/del-mar-beach-town.png",
        },
        {
          name: "Carlsbad",
          description: "Family-friendly coastal city with beaches, lagoons, and Legoland.",
          href: "/buy/san-diego/carlsbad",
          image: "/carlsbad-village.png",
        },
      ],
    },
    {
      name: "Downtown & Urban Core",
      neighborhoods: [
        {
          name: "Gaslamp Quarter",
          description: "Historic heart of downtown with Victorian architecture, dining, and nightlife.",
          href: "/buy/san-diego/gaslamp-quarter",
          image: "/gaslamp-quarter-historic.png",
        },
        {
          name: "Little Italy",
          description: "Trendy neighborhood with Italian eateries, boutiques, and art galleries.",
          href: "/buy/san-diego/little-italy",
          image: "/little-italy-san-diego.png",
        },
        {
          name: "East Village",
          description: "Rapidly developing area, home to Petco Park and modern condos.",
          href: "/buy/san-diego/east-village",
          image: "/east-village-petco.png",
        },
        {
          name: "Hillcrest",
          description: "Vibrant, LGBTQ+-friendly neighborhood with diverse shops and restaurants.",
          href: "/buy/san-diego/hillcrest",
          image: "/placeholder.svg?height=300&width=400",
        },
        {
          name: "North Park",
          description: "Hipster hub with craft breweries, cafes, and boutiques.",
          href: "/buy/san-diego/north-park",
          image: "/placeholder.svg?height=300&width=400",
        },
      ],
    },
    {
      name: "Inland & Suburban",
      neighborhoods: [
        {
          name: "Rancho Bernardo",
          description: "Master-planned community with golf courses and business parks.",
          href: "/buy/san-diego/rancho-bernardo",
          image: "/placeholder.svg?height=300&width=400",
        },
        {
          name: "Poway",
          description: "Family-oriented city known as 'The City in the Country'.",
          href: "/buy/san-diego/poway",
          image: "/placeholder.svg?height=300&width=400",
        },
        {
          name: "Scripps Ranch",
          description: "Affluent residential community with parks and good schools.",
          href: "/buy/san-diego/scripps-ranch",
          image: "/placeholder.svg?height=300&width=400",
        },
        {
          name: "Chula Vista",
          description: "Large suburban city in South Bay with diverse communities.",
          href: "/buy/san-diego/chula-vista",
          image: "/placeholder.svg?height=300&width=400",
        },
      ],
    },
  ],
  facts: [
    { icon: Sun, title: "Average Sunny Days", value: "266 per year" },
    { icon: Users, title: "Population (City)", value: "Approx. 1.4 million" },
    { icon: Waves, title: "Coastline Length", value: "70 miles in San Diego County" },
    { icon: Landmark, title: "Famous For", value: "Balboa Park, San Diego Zoo, USS Midway" },
    { icon: Briefcase, title: "Key Industries", value: "Military, Tourism, Biotech, Tech" },
    { icon: Anchor, title: "Largest Naval Fleet", value: "Home to the largest naval fleet in the world" },
  ],
  faqs: [
    {
      question: "What is the best time of year to visit San Diego?",
      answer:
        "San Diego is great year-round! Spring (March-May) and Fall (September-November) offer pleasant weather and fewer crowds. Summer is popular for beach activities.",
    },
    {
      question: "Is San Diego an expensive city to live in?",
      answer:
        "San Diego's cost of living, particularly housing, is higher than the national average, comparable to other major California cities. However, it varies significantly by neighborhood.",
    },
    {
      question: "What are the main job sectors in San Diego?",
      answer:
        "Key sectors include defense/military, tourism, international trade, biotechnology, and research. The tech industry is also growing significantly.",
    },
    {
      question: "How is the public transportation in San Diego?",
      answer:
        "San Diego has a public transit system (MTS) with buses and trolleys. While useful for some areas, many residents find a car necessary for commuting, especially to suburban areas.",
    },
    {
      question: "What are some must-do activities in San Diego?",
      answer:
        "Visit Balboa Park (museums, gardens, Zoo), explore the Gaslamp Quarter, relax on Coronado Beach, visit the USS Midway Museum, and enjoy the various beach towns like La Jolla and Pacific Beach.",
    },
  ],
  marketTrends: [
    {
      metric: "Median Home Price",
      value: "$950,000",
      change: "+7.5% YoY",
      changeType: "positive",
      icon: HomeIcon,
    },
    {
      metric: "Average Days on Market",
      value: "28 days",
      change: "-5 days YoY",
      changeType: "positive", // Positive for sellers
      icon: TrendingUp,
    },
    {
      metric: "Homes Sold Last Month",
      value: "1,230",
      change: "+3.2% MoM",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      metric: "Price Per Square Foot",
      value: "$650",
      change: "+6.1% YoY",
      changeType: "positive",
      icon: HomeIcon,
    },
  ],
  testimonials: [
    {
      quote:
        "Crown Coastal Homes helped us find our dream beachfront property in La Jolla. Their knowledge of the San Diego market is unparalleled. The process was smooth and professional from start to finish!",
      author: "The Miller Family",
      location: "La Jolla, San Diego",
      rating: 5,
    },
    {
      quote:
        "As first-time homebuyers in a competitive market like San Diego, we were overwhelmed. The team at Crown Coastal Homes guided us every step of the way and found us a perfect condo in Little Italy.",
      author: "Sarah & Tom P.",
      location: "Little Italy, San Diego",
      rating: 5,
    },
    {
      quote:
        "Selling our North Park home with Crown Coastal Homes was a fantastic experience. They marketed our property beautifully and secured a great offer quickly. Highly recommend their services!",
      author: "David R.",
      location: "North Park, San Diego",
      rating: 4,
    },
  ],
  metaTitle: "San Diego Real Estate | Homes for Sale in San Diego, CA | Crown Coastal Homes",
  metaDescription:
    "Explore homes for sale in San Diego. Discover diverse neighborhoods, from coastal La Jolla to vibrant Downtown. Find your dream San Diego property with Crown Coastal Homes.",
}

export const citiesData: Record<string, CityData> = {
  "san-diego": sanDiegoData,
}

export const getCityData = (cityId: string): CityData | undefined => {
  return citiesData[cityId.toLowerCase()]
}
