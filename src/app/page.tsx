import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Search, User } from "lucide-react"
import SearchBar from "@/components/home/search-bar"
import RealEstateGrid from "@/components/home/grid"
export default function HomePage() {

  const featuredProperties = [
    { price: 750000, description: "Luxury Villa, Beverly Hills", details: "5 🛏 4 🛁 4,200 sqft" },
    { price: 550000, description: "Modern Apartment, Downtown", details: "3 🛏 2 🛁 1,800 sqft" },
    { price: 950000, description: "Waterfront Estate, Miami", details: "6 🛏 5 🛁 5,500 sqft" },
    { price: 950000, description: "Waterfront Estate, Miami", details: "6 🛏 5 🛁 5,500 sqft" },
    { price: 950000, description: "Waterfront Estate, Miami", details: "6 🛏 5 🛁 5,500 sqft" }

  ];

  return (
    <div className="font-sans">
    
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Find Your Dream Home</h1>
        <p className="mb-6">Search properties for sale and rent across the country</p>

        <SearchBar />
      </section>

      {/* Featured Properties */}
      <section className="py-12 px-6">
       <RealEstateGrid />
      </section>

      {/* Call to Action */}
      <section className="bg-gray-900 text-white text-center py-16 px-6">
        <h2 className="text-2xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
        <p className="mb-6">Connect with our expert agents today</p>
        <Button variant="secondary">Contact an Agent</Button>
      </section>
    </div>
  )
}
