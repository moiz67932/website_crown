"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, User, Heart, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Properties", href: "/properties" },
    {
      name: "Categories",
      href: "#",
      dropdown: [
        { name: "Houses", href: "/properties?category=houses" },
        { name: "Apartments", href: "/properties?category=apartments" },
        { name: "Villas", href: "/properties?category=villas" },
        { name: "Commercial", href: "/properties?category=commercial" },
        { name: "Land", href: "/properties?category=land" },
      ],
    },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-3 md:py-4"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-12 w-48 md:h-14 md:w-56">

              <Image src="/logo.svg" alt="Real Estate Logo" fill className="object-contain" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) =>
              item.dropdown ? (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`flex items-center px-3 py-2 text-sm font-medium ${isScrolled ? "text-slate-800 hover:text-slate-900" : "text-slate-800 hover:text-slate-900"
                        }`}
                    >
                      {item.name}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {item.dropdown.map((dropdownItem) => (
                      <Link href={dropdownItem.href} key={dropdownItem.name}>
                        <DropdownMenuItem className="cursor-pointer">{dropdownItem.name}</DropdownMenuItem>
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
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
              ),
            )}
          </nav>

          {/* User Actions */}
          <div className="hidden lg:flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="text-slate-700">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-700">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="outline" className="ml-2">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button className="bg-slate-800 hover:bg-slate-900 ml-2">List Property</Button>
          </div>

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
              {navItems.map((item) =>
                item.dropdown ? (
                  <div key={item.name} className="space-y-2">
                    <div className="font-medium text-slate-900 px-3 py-2">{item.name}</div>
                    <div className="pl-4 space-y-1 border-l-2 border-slate-200">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          href={dropdownItem.href}
                          key={dropdownItem.name}
                          className="block px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
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
                ),
              )}
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
