import { Button } from "@/components/ui/button"
import SearchBar from "@/components/home/search-bar"
import RealEstateGrid from "@/components/home/grid"
export default function HomePage() {

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
