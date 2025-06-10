"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Properties", href: "/properties" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  // Split nav items for left and right of logo
  const leftNavItems = [
    { name: "Buy", href: "/buy" },
    { name: "Rent", href: "/rent" },
    { name: "Sell", href: "/sell" },
    // { name: "Get a mortgage", href: "/mortgage" },
    // { name: "Find an Agent", href: "/agent" },
  ];
  const rightNavItems = [
    { name: "About", href: "/about" },
    // { name: "Contact", href: "/contact" },
    // { name: "Help", href: "/help" },
  ];

  // Mobile menu dropdowns for Buy and Rent
  const mobileBuyItems = [
    { label: "Houses", href: "/properties?propertyType=Residential&status=for-sale" },
    { label: "Townhouses", href: "/properties?propertyType=Residential&status=for-sale" },
    { label: "Condos", href: "/properties?propertyType=Condo&status=for-sale" },
    { label: "Manufactured", href: "/properties?propertyType=ManufacturedInPark&status=for-sale" },
    { label: "Lot/Land", href: "/properties?propertyType=Land&status=for-sale" },
    { label: "New Homes/New Construction", href: "/properties?propertyType=Residential&status=for-sale" },
    { label: "All Homes", href: "/properties?status=for-sale" },
  ];
  const mobileRentItems = [
    { label: "Houses for Rent", href: "/properties?propertyType=ResidentialLease&status=for-rent" },
    { label: "Apartments for Rent", href: "/properties?propertyType=ResidentialLease&status=for-rent" },
    { label: "Townhomes for Rent", href: "/properties?propertyType=ResidentialLease&status=for-rent" },
    { label: "All Rentals", href: "/properties?propertyType=ResidentialLease&status=for-rent" },
  ];

  // State for mobile dropdowns
  const [mobileBuyOpen, setMobileBuyOpen] = useState(false);
  const [mobileRentOpen, setMobileRentOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setMobileBuyOpen(false);
    setMobileRentOpen(false);
    // eslint-disable-next-line
  }, [pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FAF4ED] py-3 md:py-4 border-b border-[#f0e9e0] shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Desktop Navigation - Left */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-start">
            {/* Buy Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className={`px-3 py-2 text-sm font-text-slate-900 font-medium text-sm hover:text-yellow-600 transition-colors focus:bg-[#13304A]`}
                  >
                    Buy
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[260px] p-0 bg-[#FAF4ED] text-slate-900 border-none shadow-lg" sideOffset={8}>
              <DropdownMenuLabel className="text-lg font-semibold px-6 py-4 text-slate-900">For Sale</DropdownMenuLabel>

                {mobileBuyItems.map((item) => (
                                      <Link href={item.href}>

                  <DropdownMenuItem key={item.label} className="px-6 py-2 text-base hover:text-[#D4AF37]">
                    {item.label}
                  </DropdownMenuItem>
                  </Link>

                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Rent Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className={`px-3 py-2 text-sm font-text-slate-900 font-medium text-sm hover:text-yellow-600 transition-colors focus:bg-[#13304A]`}
                  >
                    Rent
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[260px] p-0 bg-[#FAF4ED] text-slate-900 border-none shadow-lg" sideOffset={8}>
                <DropdownMenuLabel className="text-lg font-semibold px-6 py-4 text-slate-900">For Rent</DropdownMenuLabel>
                {mobileRentItems.map((item) => (
                  <Link href={item.href}>

                  <DropdownMenuItem key={item.label} className="px-6 py-2 text-base hover:text-[#D4AF37]">
                    {item.label}
                  </DropdownMenuItem>
                  </Link>

                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Other left nav items */}
            {leftNavItems.filter(item => item.name !== 'Buy' && item.name !== 'Rent').map((item) => (
              <Link href={item.href} key={item.name}>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 text-sm font-medium text-slate-900 font-medium text-sm hover:text-yellow-600 transition-colors`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Logo Centered */}
          <div className="flex-0 flex justify-center items-center w-12 md:w-16 absolute left-1/2 transform -translate-x-1/2 lg:static lg:translate-x-0">
            <Link href="/" className="flex items-center justify-center">
              <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#f5eee6] flex items-center justify-center shadow-md">
                {/* Placeholder for logo icon */}
                <Image src="/logo.svg" alt="Logo" width={40} height={40} />
              </div>
            </Link>
            <Link href="/" className="flex items-center justify-center">
              <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#f5eee6] flex items-center justify-center shadow-md">
                <Image src="/exp-realty-logo.webp" alt="exp-realty-logo" width={40} height={40} />
              </div>
            </Link>
          </div>

          {/* Right Nav */}
          <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-end">
            <Link href="/about" className="text-slate-900 font-medium text-sm hover:text-yellow-600 transition-colors">About</Link>
            <Link href="/contact" className="text-slate-900 font-medium text-sm hover:text-yellow-600 transition-colors">Contact</Link>
            <Link href="/auth/login">
              <Button className="ml-4 bg-yellow-400 text-slate-900 font-semibold px-5 py-2 rounded-full shadow-sm hover:bg-yellow-300 border-none transition-colors text-sm">Login</Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-slate-900 p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF4ED] border-t border-[#f0e9e0] mt-2 absolute left-0 right-0 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto z-50">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-1">
              {/* Buy Dropdown */}
              <div>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 font-medium rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors"
                  onClick={() => {
                    setMobileBuyOpen((open) => !open);
                    setMobileRentOpen(false);
                  }}
                  aria-expanded={mobileBuyOpen}
                  aria-controls="mobile-buy-menu"
                  type="button"
                >
                  <span>Buy</span>
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${mobileBuyOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileBuyOpen && (
                  <div id="mobile-buy-menu" className="ml-4 mt-1 flex flex-col space-y-1">
                    {mobileBuyItems.map((item) => (
                      <Link
                        href={item.href}
                        key={item.label}
                        className="block px-3 py-2 text-sm rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {/* Rent Dropdown */}
              <div>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 font-medium rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors"
                  onClick={() => {
                    setMobileRentOpen((open) => !open);
                    setMobileBuyOpen(false);
                  }}
                  aria-expanded={mobileRentOpen}
                  aria-controls="mobile-rent-menu"
                  type="button"
                >
                  <span>Rent</span>
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${mobileRentOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileRentOpen && (
                  <div id="mobile-rent-menu" className="ml-4 mt-1 flex flex-col space-y-1">
                    {mobileRentItems.map((item) => (
                      <Link
                        href={item.href}
                        key={item.label}
                        className="block px-3 py-2 text-sm rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                    href="/sell"
                    key="Sell"
                    className="px-3 py-2 font-medium rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sell
                  </Link>
              {/* Other nav items */}
              {navItems
                .filter(item => item.name !== "Home" && item.name !== "Buy" && item.name !== "Rent")
                .map((item) => (
                  <Link
                    href={item.href}
                    key={item.name}
                    className="px-3 py-2 font-medium rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
            </nav>
            <div className="mt-4 flex flex-col space-y-2">
              <Link href="/auth/login">
                <Button variant="outline" className="justify-center w-full text-slate-900 border-slate-900 hover:bg-[#D4AF37] hover:text-[#13304A]">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/properties/">
              <Button className="bg-[#D4AF37] hover:bg-[#bfa13a] text-[#13304A] justify-center w-full font-semibold">List Property</Button>

              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
