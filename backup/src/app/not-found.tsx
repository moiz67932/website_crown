import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found | Real Estate",
  description: "The page you are looking for does not exist.",
}

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-16 mx-auto text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">404 - Page Not Found</h1>

      <p className="max-w-md mx-auto text-lg text-muted-foreground mb-8">
        We couldn't find the property you're looking for. It might have been sold, removed from our listings, or the
        address was entered incorrectly.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Button asChild size="lg">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/properties">Browse Properties</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          <form action="/map" className="relative">
            <input
              type="text"
              name="location"
              placeholder="Search for a location..."
              className="w-full h-12 pl-4 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-primary"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Need help?{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Contact our support team
        </Link>
      </p>
    </div>
  )
}
