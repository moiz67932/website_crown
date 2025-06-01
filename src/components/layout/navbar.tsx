"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, User, Heart, Bell } from "lucide-react"

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
    // { name: "Sell", href: "/sell" },
    // { name: "Get a mortgage", href: "/mortgage" },
    // { name: "Find an Agent", href: "/agent" },
  ];
  const rightNavItems = [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    // { name: "Help", href: "/help" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-3 md:py-4"
        }`}
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
                    className={`px-3 py-2 text-sm font-medium ${pathname === '/buy'
                        ? 'text-slate-900 bg-slate-100'
                        : isScrolled
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    Buy
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[260px] p-0" sideOffset={8}>
                <DropdownMenuLabel className="text-lg font-semibold px-6 py-4">For Sale</DropdownMenuLabel>
                <DropdownMenuItem className="px-6 py-2 text-base">Houses</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">Townhouses</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">Condos</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">Manufactured</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">Lot/Land</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">New Homes/New Construction</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">All Homes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Rent Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className={`px-3 py-2 text-sm font-medium ${pathname === '/rent'
                        ? 'text-slate-900 bg-slate-100'
                        : isScrolled
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    Rent
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[260px] p-0" sideOffset={8}>
                <DropdownMenuLabel className="text-lg font-semibold px-6 py-4">For Rent</DropdownMenuLabel>
                <DropdownMenuItem className="px-6 py-2 text-base">Houses for Rent</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">Apartments for Rent</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">Townhomes for Rent</DropdownMenuItem>
                <DropdownMenuItem className="px-6 py-2 text-base">All Rentals</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Other left nav items */}
            {leftNavItems.filter(item => item.name !== 'Buy' && item.name !== 'Rent').map((item) => (
              <Link href={item.href} key={item.name}>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 text-sm font-medium ${pathname === item.href
                      ? "text-slate-900 bg-slate-100"
                      : isScrolled
                        ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Logo Centered */}
          <div className="flex-0 flex justify-center items-center w-48 md:w-56 absolute left-1/2 transform -translate-x-1/2 lg:static lg:translate-x-0">
            <Link href="/" className="flex items-center">
            <div className="relative h-12 w-48 md:h-14 md:w-56">
                <Image src="/logo.svg" alt="Real Estate Logo" fill className="object-contain" />
              </div>
              <div className="relative h-12 w-48 md:h-14 md:w-56 hidden md:flex ml-2 md:ml-4 h-8 md:h-10 border-l border-gray-400 pl-2 md:pl-4">
                <Image src="/exp-realty-logo.webp" alt="Exp Realty Logo" fill className="object-contain" />
              </div>
            
            </Link>
          </div>

          {/* Desktop Navigation - Right */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-end">
            {rightNavItems.map((item) => (
              <Link href={item.href} key={item.name}>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 text-sm font-medium ${pathname === item.href
                      ? "text-slate-900 bg-slate-100"
                      : isScrolled
                        ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-slate-700 p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 mt-2 absolute left-0 right-0 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  href={item.href}
                  key={item.name}
                  className={`px-3 py-2 font-medium rounded-md ${pathname === item.href
                      ? "text-slate-900 bg-slate-100"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col space-y-2">
              <Link href="/auth/login">
                <Button variant="outline" className="justify-center w-full">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Button className="bg-slate-800 hover:bg-slate-900 justify-center w-full">List Property</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
