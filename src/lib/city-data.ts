import { Landmark, Sun, Users, Briefcase, Waves, Anchor, TrendingUp, HomeIcon, StarIcon, MapPin, MessageSquare } from "lucide-react"
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
  osmBoundingBox?: [number, number, number, number] // [south, west, north, east]
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
  osmBoundingBox: [32.5343, -117.2872, 33.1142, -116.9056], // [south, west, north, east] for San Diego city area
}

const losAngelesData: CityData = {
  id: "los-angeles",
  name: "Los Angeles",
  fullName: "Los Angeles, California",
  heroImage: "/los-angeles-skyline-sunset.png",
  heroTitle: "Live the LA Dream",
  heroSubtitle: "From Hollywood glamour to sun-soaked beaches, discover your place in the City of Angels.",
  introText:
    "Los Angeles is a vibrant metropolis known for its iconic entertainment industry, diverse neighborhoods, and endless sunshine. Whether you're drawn to the luxury of Beverly Hills, the creative energy of Silver Lake, or the laid-back vibes of Santa Monica, LA offers something for everyone. Explore world-class dining, arts, and outdoor adventures in a city where dreams become reality. Let Crown Coastal Homes help you find your perfect home in this dynamic city.",
  mapPlaceholderImage: "/los-angeles-neighborhoods-map.png",
  neighborhoodCategories: [
    {
      name: "Westside",
      neighborhoods: [
        {
          name: "Santa Monica",
          description: "Beachfront city with a famous pier, upscale shopping, and vibrant nightlife.",
          href: "/buy/los-angeles/santa-monica",
          image: "/santa-monica-pier.png",
        },
        {
          name: "Venice",
          description: "Trendy neighborhood known for its canals, boardwalk, and eclectic spirit.",
          href: "/buy/los-angeles/venice",
          image: "/venice-beach-boardwalk.png",
        },
        {
          name: "Brentwood",
          description: "Leafy, upscale area with boutiques, cafes, and beautiful homes.",
          href: "/buy/los-angeles/brentwood",
          image: "/brentwood-village.png",
        },
        {
          name: "Pacific Palisades",
          description: "Scenic coastal enclave with luxury homes and mountain views.",
          href: "/buy/los-angeles/pacific-palisades",
          image: "/pacific-palisades-overlook.png",
        },
      ],
    },
    {
      name: "Central LA",
      neighborhoods: [
        {
          name: "Hollywood",
          description: "World-famous for its entertainment industry, nightlife, and historic landmarks.",
          href: "/buy/los-angeles/hollywood",
          image: "/hollywood-sign.png",
        },
        {
          name: "West Hollywood",
          description: "Trendy, walkable area with vibrant nightlife and shopping.",
          href: "/buy/los-angeles/west-hollywood",
          image: "/west-hollywood-sunset-strip.png",
        },
        {
          name: "Koreatown",
          description: "Bustling neighborhood with diverse cuisine and lively nightlife.",
          href: "/buy/los-angeles/koreatown",
          image: "/koreatown-la.png",
        },
        {
          name: "Downtown LA",
          description: "Urban center with arts, dining, and historic architecture.",
          href: "/buy/los-angeles/downtown",
          image: "/downtown-la-skyline.png",
        },
      ],
    },
    {
      name: "Eastside & Hills",
      neighborhoods: [
        {
          name: "Silver Lake",
          description: "Hip, creative community with indie shops and a scenic reservoir.",
          href: "/buy/los-angeles/silver-lake",
          image: "/silver-lake-reservoir.png",
        },
        {
          name: "Los Feliz",
          description: "Charming neighborhood with historic homes and Griffith Park access.",
          href: "/buy/los-angeles/los-feliz",
          image: "/los-feliz-homes.png",
        },
        {
          name: "Echo Park",
          description: "Trendy area with a lively arts scene and beautiful lake.",
          href: "/buy/los-angeles/echo-park",
          image: "/echo-park-lake.png",
        },
        {
          name: "Hollywood Hills",
          description: "Exclusive hillside homes with panoramic city views.",
          href: "/buy/los-angeles/hollywood-hills",
          image: "/hollywood-hills-view.png",
        },
      ],
    },
    {
      name: "Luxury & Iconic",
      neighborhoods: [
        {
          name: "Beverly Hills",
          description: "World-renowned for luxury estates, shopping, and celebrity residents.",
          href: "/buy/los-angeles/beverly-hills",
          image: "/beverly-hills-sign.png",
        },
        {
          name: "Bel Air",
          description: "Prestigious enclave with grand mansions and lush landscapes.",
          href: "/buy/los-angeles/bel-air",
          image: "/bel-air-gates.png",
        },
        {
          name: "Malibu",
          description: "Famous for its stunning beaches, oceanfront homes, and relaxed lifestyle.",
          href: "/buy/los-angeles/malibu",
          image: "/malibu-pier.png",
        },
      ],
    },
  ],
  facts: [
    {
      icon: StarIcon,
      title: "Population",
      value: "3.9M+",
    },
    {
      icon: HomeIcon,
      title: "Median Home Price",
      value: "$980,000",
    },
    {
      icon: MapPin,
      title: "Area",
      value: "503 sq mi",
    },
    {
      icon: MessageSquare,
      title: "Sunny Days/Year",
      value: "284",
    },
  ],
  faqs: [
    {
      question: "What are the best neighborhoods for families in Los Angeles?",
      answer:
        "Popular family-friendly neighborhoods include Brentwood, Pacific Palisades, Sherman Oaks, and Studio City, known for excellent schools, parks, and a strong sense of community.",
    },
    {
      question: "Is Los Angeles a good place for investment properties?",
      answer:
        "Yes, LA's diverse economy, strong rental demand, and world-class amenities make it a top choice for real estate investors. Neighborhoods like Downtown, Hollywood, and West LA offer great opportunities.",
    },
    {
      question: "How is the commute in Los Angeles?",
      answer:
        "LA is known for its traffic, but many neighborhoods are walkable or have access to public transit. Proximity to work and lifestyle amenities is a key consideration when choosing a neighborhood.",
    },
    {
      question: "What is the weather like in Los Angeles?",
      answer:
        "Los Angeles enjoys a Mediterranean climate with warm, dry summers and mild, wet winters. Expect plenty of sunshine year-round.",
    },
  ],
  marketTrends: [
    {
      metric: "Median Sale Price",
      value: "$980,000",
      change: "+2.8% YoY",
      changeType: "positive",
      icon: HomeIcon,
    },
    {
      metric: "Average Days on Market",
      value: "34 days",
      change: "+3 days YoY",
      changeType: "negative",
      icon: TrendingUp,
    },
    {
      metric: "Homes Sold Last Month",
      value: "2,100",
      change: "-1.5% MoM",
      changeType: "negative",
      icon: TrendingUp,
    },
    {
      metric: "Price Per Square Foot",
      value: "$720",
      change: "+4.2% YoY",
      changeType: "positive",
      icon: HomeIcon,
    },
  ],
  testimonials: [
    {
      quote:
        "Crown Coastal Homes made our move to LA seamless. Their expertise in the Westside market helped us find a beautiful home in Santa Monica.",
      author: "Jessica & Mark L.",
      location: "Santa Monica, Los Angeles",
      rating: 5,
    },
    {
      quote:
        "We sold our Hollywood condo above asking price thanks to the team's marketing and negotiation skills. Highly recommend!",
      author: "Carlos M.",
      location: "Hollywood, Los Angeles",
      rating: 5,
    },
    {
      quote:
        "As first-time buyers, we felt supported every step of the way. We love our new home in Silver Lake!",
      author: "Priya S.",
      location: "Silver Lake, Los Angeles",
      rating: 4,
    },
  ],
  metaTitle: "Los Angeles Real Estate | Homes for Sale in Los Angeles, CA | Crown Coastal Homes",
  metaDescription:
    "Explore homes for sale in Los Angeles. Discover diverse neighborhoods, from glamorous Beverly Hills to vibrant Downtown. Find your dream LA property with Crown Coastal Homes.",
  osmBoundingBox: [33.7037, -118.6682, 34.3373, -118.1553], // [south, west, north, east] for Los Angeles city area
}

const sanFranciscoData: CityData = {
  id: "san-francisco",
  name: "San Francisco",
  fullName: "San Francisco, California",
  heroImage: "/san-francisco-golden-gate-sunset.png",
  heroTitle: "Experience San Francisco",
  heroSubtitle: "Iconic hills, vibrant neighborhoods, and world-class culture await in the City by the Bay.",
  introText:
    "San Francisco is a city of breathtaking views, diverse communities, and a rich tapestry of history and innovation. From the painted Victorians of Alamo Square to the bustling streets of Chinatown and the tech-driven energy of SoMa, San Francisco offers a lifestyle for every taste. Whether you dream of a classic Edwardian flat, a modern high-rise, or a charming cottage by the sea, Crown Coastal Homes is your guide to finding the perfect property in this legendary city.",
  mapPlaceholderImage: "/san-francisco-neighborhoods-map.png",
  neighborhoodCategories: [
    {
      name: "Central & Iconic",
      neighborhoods: [
        {
          name: "Nob Hill",
          description: "Historic, upscale neighborhood with grand hotels and sweeping city views.",
          href: "/buy/san-francisco/nob-hill",
          image: "/nob-hill-san-francisco.png",
        },
        {
          name: "Russian Hill",
          description: "Famous for Lombard Street, charming homes, and panoramic vistas.",
          href: "/buy/san-francisco/russian-hill",
          image: "/russian-hill-lombard.png",
        },
        {
          name: "Pacific Heights",
          description: "Elegant mansions, leafy streets, and stunning bay views.",
          href: "/buy/san-francisco/pacific-heights",
          image: "/pacific-heights-view.png",
        },
        {
          name: "North Beach",
          description: "Lively Italian heritage, cafes, and nightlife near the waterfront.",
          href: "/buy/san-francisco/north-beach",
          image: "/north-beach-cafe.png",
        },
      ],
    },
    {
      name: "Trendy & Diverse",
      neighborhoods: [
        {
          name: "Mission District",
          description: "Vibrant arts, diverse cuisine, and colorful murals.",
          href: "/buy/san-francisco/mission",
          image: "/mission-district-murals.png",
        },
        {
          name: "Castro",
          description: "Historic LGBTQ+ community, lively nightlife, and Victorian homes.",
          href: "/buy/san-francisco/castro",
          image: "/castro-theatre.png",
        },
        {
          name: "Hayes Valley",
          description: "Trendy boutiques, restaurants, and a central park vibe.",
          href: "/buy/san-francisco/hayes-valley",
          image: "/hayes-valley-san-francisco.png",
        },
        {
          name: "SoMa",
          description: "Modern condos, tech hubs, and vibrant nightlife.",
          href: "/buy/san-francisco/soma",
          image: "/soma-san-francisco.png",
        },
      ],
    },
    {
      name: "Classic & Family-Friendly",
      neighborhoods: [
        {
          name: "Noe Valley",
          description: "Sunny, family-friendly with charming homes and local shops.",
          href: "/buy/san-francisco/noe-valley",
          image: "/noe-valley-san-francisco.png",
        },
        {
          name: "Sunset District",
          description: "Laid-back, residential, close to Ocean Beach and Golden Gate Park.",
          href: "/buy/san-francisco/sunset",
          image: "/sunset-district-ocean-beach.png",
        },
        {
          name: "Richmond District",
          description: "Diverse, quiet, with easy access to parks and the Presidio.",
          href: "/buy/san-francisco/richmond",
          image: "/richmond-district-san-francisco.png",
        },
        {
          name: "Bernal Heights",
          description: "Hilly, eclectic, with a strong sense of community and city views.",
          href: "/buy/san-francisco/bernal-heights",
          image: "/bernal-heights-hill.png",
        },
      ],
    },
  ],
  facts: [
    {
      icon: HomeIcon,
      title: "Median Home Price",
      value: "$1,350,000",
    },
    {
      icon: TrendingUp,
      title: "1-Year Appreciation",
      value: "+4.2%",
    },
    {
      icon: HomeIcon,
      title: "Population",
      value: "808,000",
    },
    {
      icon: TrendingUp,
      title: "Walk Score",
      value: "Walker's Paradise (88)",
    },
  ],
  faqs: [
    {
      question: "What is the average home price in San Francisco?",
      answer: "The median home price in San Francisco is approximately $1,350,000, but prices vary by neighborhood and property type.",
    },
    {
      question: "Which neighborhoods are best for families?",
      answer: "Noe Valley, Sunset District, and Richmond District are popular with families for their parks, schools, and community feel.",
    },
    {
      question: "Is San Francisco a good city for investment properties?",
      answer: "San Francisco's strong rental market and long-term appreciation make it attractive for investors, though local regulations should be considered.",
    },
    {
      question: "What are the most walkable neighborhoods?",
      answer: "Neighborhoods like Nob Hill, North Beach, and Hayes Valley offer excellent walkability to shops, dining, and transit.",
    },
  ],
  marketTrends: [
    {
      metric: "Median Sale Price",
      value: "$1,350,000",
      change: "+4.2% YoY",
      changeType: "positive",
      icon: HomeIcon,
    },
    {
      metric: "Average Days on Market",
      value: "34 days",
      change: "+3 days YoY",
      changeType: "negative",
      icon: TrendingUp,
    },
    {
      metric: "Homes Sold Last Month",
      value: "2,100",
      change: "-1.5% MoM",
      changeType: "negative",
      icon: TrendingUp,
    },
    {
      metric: "Price Per Square Foot",
      value: "$1,050",
      change: "+2.8% YoY",
      changeType: "positive",
      icon: HomeIcon,
    },
  ],
  testimonials: [
    {
      quote:
        "Crown Coastal Homes made our move to San Francisco seamless. Their expertise in the local market helped us find a beautiful home in Noe Valley.",
      author: "Emily & James T.",
      location: "Noe Valley, San Francisco",
      rating: 5,
    },
    {
      quote:
        "We sold our condo in SoMa above asking price thanks to the team's marketing and negotiation skills. Highly recommend!",
      author: "Michael R.",
      location: "SoMa, San Francisco",
      rating: 5,
    },
    {
      quote:
        "As first-time buyers, we felt supported every step of the way. We love our new home in the Richmond District!",
      author: "Priya S.",
      location: "Richmond District, San Francisco",
      rating: 4,
    },
  ],
  metaTitle: "San Francisco Real Estate | Homes for Sale in San Francisco, CA | Crown Coastal Homes",
  metaDescription:
    "Explore homes for sale in San Francisco. Discover diverse neighborhoods, from iconic Nob Hill to vibrant Mission. Find your dream SF property with Crown Coastal Homes.",
  osmBoundingBox: [37.6398, -123.1738, 37.9298, -122.2818], // [south, west, north, east] for San Francisco city area
}

export const citiesData: Record<string, CityData> = {
  "san-diego": sanDiegoData,
  "los-angeles": losAngelesData,
  "san-francisco": sanFranciscoData,
}

export const getCityData = (cityId: string): CityData | undefined => {
  return citiesData[cityId.toLowerCase()]
}

const citiesName: Record<string, string> = {
  "san-diego": "San Diego",
  "los-angeles": "Los Angeles",
  "san-francisco": "San Francisco",
  "san-jose": "San Jose",
  "san-mateo": "San Mateo",
  "redwood-city": "Redwood City",
  "palm-springs": "Palm Springs",
  "palm-beach": "Palm Beach",
  "palm-beach-gardens": "Palm Beach Gardens",
  "malibu": "Malibu",
  "orange": "Orange",
  "ventura": "Ventura",
  "santa-barbara": "Santa Barbara",
  "santa-monica": "Santa Monica",
  "santa-rosa": "Santa Rosa",
  "sonoma": "Sonoma",
  "napa": "Napa",
  "yosemite": "Yosemite",
}

export const MappingCityIdToCityName = (cityId: string): string => {
  return citiesName[cityId.toLowerCase()]
}