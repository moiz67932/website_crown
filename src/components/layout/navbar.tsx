"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { navStyles } from "./navbar.styles"

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
      className={navStyles.header}
    >
      <div className={navStyles.container}>
        <div className={navStyles.navContainer}>
          {/* Desktop Navigation - Left */}
          <nav className={navStyles.desktopNav}>
            {/* Buy Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className={navStyles.desktopDropdownButton}
                  >
                    Buy
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={navStyles.dropdownContent} sideOffset={8}>
              <DropdownMenuLabel className={navStyles.dropdownLabel}>For Sale</DropdownMenuLabel>

                {mobileBuyItems.map((item) => (
                                      <Link href={item.href} key={item.label}>

                  <DropdownMenuItem className={navStyles.dropdownItem}>
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
                    className={navStyles.desktopDropdownButton}
                  >
                    Rent
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={navStyles.dropdownContent} sideOffset={8}>
                <DropdownMenuLabel className={navStyles.dropdownLabel}>For Rent</DropdownMenuLabel>
                {mobileRentItems.map((item) => (
                  <Link href={item.href} key={item.label}>

                  <DropdownMenuItem className={navStyles.dropdownItem}>
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
                  className={navStyles.desktopNavLink}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Logo Centered - Bigger */}
          <div className={navStyles.logoContainer}>
            <Link href="/" className={navStyles.logoLink}>
              <div className={navStyles.logoImageContainer}>
                {/* Placeholder for logo icon */}
                <Image src="/logo.png" alt="Logo" width={224} height={224} />
              </div>
            </Link>
          </div>

          {/* Right Nav */}
          <nav className={navStyles.rightNav}>
            <Link href="/about" className={navStyles.rightNavLink}>About</Link>
            <Link href="/contact" className={navStyles.rightNavLink}>Contact</Link>
           
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className={navStyles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={navStyles.mobileMenuContainer}>
          <div className={navStyles.container}>
            <nav className={navStyles.mobileNav}>
              {/* Buy Dropdown */}
              <div>
                <button
                  className={navStyles.mobileDropdownButton}
                  onClick={() => {
                    setMobileBuyOpen((open) => !open);
                    setMobileRentOpen(false);
                  }}
                  aria-expanded={mobileBuyOpen}
                  aria-controls="mobile-buy-menu"
                  type="button"
                >
                  <span>Buy</span>
                  <ChevronDown className={navStyles.mobileChevron(mobileBuyOpen)} />
                </button>
                {mobileBuyOpen && (
                  <div id="mobile-buy-menu" className={navStyles.mobileDropdownContent}>
                    {mobileBuyItems.map((item) => (
                      <Link
                        href={item.href}
                        key={item.label}
                        className={navStyles.mobileDropdownItem}
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
                  className={navStyles.mobileDropdownButton}
                  onClick={() => {
                    setMobileRentOpen((open) => !open);
                    setMobileBuyOpen(false);
                  }}
                  aria-expanded={mobileRentOpen}
                  aria-controls="mobile-rent-menu"
                  type="button"
                >
                  <span>Rent</span>
                  <ChevronDown className={navStyles.mobileChevron(mobileRentOpen)} />
                </button>
                {mobileRentOpen && (
                  <div id="mobile-rent-menu" className={navStyles.mobileDropdownContent}>
                    {mobileRentItems.map((item) => (
                      <Link
                        href={item.href}
                        key={item.label}
                        className={navStyles.mobileDropdownItem}
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
                    className={navStyles.mobileNavLink}
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
                    className={navStyles.mobileNavLink}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
            </nav>
            <div className={navStyles.mobileButtonsContainer}>

              <Link href="/properties/">
              <Button className={navStyles.mobileListPropertyButton}>List Property</Button>

              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
