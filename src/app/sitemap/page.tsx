import type { Metadata } from "next"
import Link from "next/link"
import { Search, Home, Building, MapPin, Users, Settings, FileText, Calculator, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Sitemap | Real Estate",
  description: "Complete navigation guide to all pages and sections of our real estate website.",
}

export default function SitemapPage() {
  return (
    <main className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Website Sitemap</h1>
          <p className="text-lg text-slate-600 mb-8">
            Find everything you need on our website. Browse by category or search for specific pages.
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-slate-600" />
                Main Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SitemapLink href="/" title="Homepage" description="Welcome page with featured properties" />
              <SitemapLink href="/about" title="About Us" description="Learn about our company and team" />
              <SitemapLink href="/contact" title="Contact Us" description="Get in touch with our team" />
              <SitemapLink href="/sitemap" title="Sitemap" description="This page - complete site navigation" />
            </CardContent>
          </Card>

          {/* Property Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-slate-600" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SitemapLink
                href="/properties"
                title="All Properties"
                description="Browse our complete property listings"
              />
              <SitemapLink
                href="/properties?category=houses"
                title="Houses"
                description="Single-family homes and houses"
              />
              <SitemapLink
                href="/properties?category=apartments"
                title="Apartments"
                description="Apartment and condo listings"
              />
              <SitemapLink href="/properties?category=villas" title="Villas" description="Luxury villa properties" />
              <SitemapLink
                href="/properties?category=commercial"
                title="Commercial"
                description="Commercial real estate"
              />
              <SitemapLink
                href="/properties?category=luxury"
                title="Luxury Properties"
                description="Premium luxury listings"
              />
              <SitemapLink href="/properties?category=land" title="Land" description="Land and lot listings" />
            </CardContent>
          </Card>

          {/* Map & Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-600" />
                Map & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SitemapLink href="/map" title="Property Map" description="Interactive map with property locations" />
              <SitemapLink
                href="/map?view=list"
                title="Map List View"
                description="Properties in list format with map"
              />
              <div className="text-sm text-slate-500 italic">
                • Draw search areas on map
                <br />• Filter by location and amenities
                <br />• View property statistics
              </div>
            </CardContent>
          </Card>

          {/* User Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                User Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SitemapLink href="/login" title="Login" description="Sign in to your account" />
              <SitemapLink href="/signup" title="Sign Up" description="Create a new account" />
              <SitemapLink href="/forgot-password" title="Forgot Password" description="Reset your password" />
              <div className="text-sm text-slate-500 italic">
                Account features:
                <br />• Save favorite properties
                <br />• Property alerts
                <br />• Search history
              </div>
            </CardContent>
          </Card>

          {/* Tools & Calculators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-slate-600" />
                Tools & Calculators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                <strong>Mortgage Calculator</strong>
                <div className="text-slate-500 text-xs mt-1">Available on individual property pages</div>
              </div>
              <div className="text-sm text-slate-500 italic">
                Calculator features:
                <br />• Monthly payment breakdown
                <br />• Total cost analysis
                <br />• Property tax estimates
                <br />• Insurance calculations
              </div>
            </CardContent>
          </Card>

          {/* Property Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-slate-600" />
                Property Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                <strong>Individual Property Pages</strong>
                <div className="text-slate-500 text-xs mt-1">Each property includes:</div>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                • High-resolution photo galleries
                <br />• Interactive property maps
                <br />• Street View integration
                <br />• Neighborhood information
                <br />• Mortgage calculator
                <br />• Contact forms
                <br />• Similar properties
                <br />• Property FAQ
              </div>
            </CardContent>
          </Card>

          

          {/* Error Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                System Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                <strong>Error & System Pages</strong>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                • 404 - Page Not Found
                <br />• Loading states
                <br />• Error boundaries
              </div>
              <div className="text-sm text-slate-600 mt-4">
                <strong>Search Features</strong>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                • Location-based search
                <br />• Advanced property filters
                <br />• Price range filtering
                <br />• Property type selection
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900">25+</div>
                  <div className="text-sm text-slate-500">Total Pages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">100000+</div>
                  <div className="text-sm text-slate-500">Property Listings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">100+</div>
                  <div className="text-sm text-slate-500">Property Categories</div>
                </div>
              </div>
              <div className="text-sm text-slate-500 text-center mt-4">
                All pages are mobile-responsive and optimized for performance
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Help Finding Something?</h3>
            <p className="text-slate-600 mb-4">
              Can't find what you're looking for? Our team is here to help you navigate our website and find the perfect
              property.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <button className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 transition-colors hover:cursor-pointer">
                  Contact Support
                </button>
              </Link>
              <Link href="/properties">
                <button className="border border-slate-300 text-slate-700 px-6 py-2 rounded-md hover:bg-slate-50 transition-colors hover:cursor-pointer">
                  Browse Properties
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Helper component for sitemap links
function SitemapLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <div className="border-l-2 border-slate-200 pl-3">
      <Link href={href} className="block hover:bg-slate-50 -ml-3 pl-3 py-1 rounded-r transition-colors">
        <div className="font-medium text-slate-900 hover:text-slate-700">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </Link>
    </div>
  )
}
