"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, User, LogOut, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { navStyles } from "./navbar.styles"
import { useAuth } from "@/hooks/use-auth"
import ThemeToggle from "@/components/theme-toggle"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, logout } = useAuth()

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
    { name: "Home", href: "/" },
    { name: "Buy", href: "/buy" },
    { name: "Rent", href: "/rent" },
    { name: "Sell", href: "/sell" },
    // { name: "Get a mortgage", href: "/mortgage" },
    // { name: "Find an Agent", href: "/agent" },
  ];
  const rightNavItems = [
    { name: "Compare", href: "/compare" },
    { name: "About", href: "/about" },
    // { name: "Contact", href: "/contact" },
    // { name: "Help", href: "/help" },
  ];

  // Mobile menu dropdowns for Buy and Rent
  const mobileBuyItems = [
    { label: "Houses", href: "/properties?propertyType=Residential" },
    { label: "Townhouses", href: "/properties?propertyType=Residential" },
    { label: "Condos", href: "/properties?propertyType=Residential" },
    { label: "Manufactured", href: "/properties?propertyType=Residential" },
    { label: "Lot/Land", href: "/properties?propertyType=Residential" },
    { label: "New Homes/New Construction", href: "/properties?propertyType=Residential" },
    { label: "All Homes", href: "/properties?propertyType=Residential" },
  ];
  const mobileRentItems = [
    { label: "Houses for Rent", href: "/properties?propertyType=ResidentialLease" },
    { label: "Apartments for Rent", href: "/properties?propertyType=ResidentialLease" },
    { label: "Townhomes for Rent", href: "/properties?propertyType=ResidentialLease" },
    { label: "All Rentals", href: "/properties?propertyType=ResidentialLease" },
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
                  <DropdownMenuItem key={item.label} className={navStyles.dropdownItem} asChild>
                    <Link href={item.href}>
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
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
                  <DropdownMenuItem key={item.label} className={navStyles.dropdownItem} asChild>
                    <Link href={item.href}>
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
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
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Authentication Section */}
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  // User is logged in - show user dropdown
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                        <User className="h-4 w-4" />
                        <span className="hidden md:block">{user.name.split(' ')[0]}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Profile Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={logout}
                        className="flex items-center gap-2 text-red-600 focus:text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  // User is not logged in - show sign in/up buttons
                  <div className="flex items-center gap-2">
                    <Link href="/auth/login">
                      <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/resgister">
                      <Button className="bg-slate-800 hover:bg-slate-900 text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
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
              {/* Home Link */}
              <Link
                href="/"
                className={navStyles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
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
              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Theme</span>
                <ThemeToggle />
              </div>
              
              <Link href="/properties/">
                <Button className={navStyles.mobileListPropertyButton}>List Property</Button>
              </Link>
              
              {/* Mobile Authentication Buttons */}
              {!isLoading && (
                <>
                  {isAuthenticated && user ? (
                    // User is logged in - show user info and logout
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <Link href="/profile">
                        <Button variant="ghost" className="w-full justify-start text-slate-700" onClick={() => setIsMobileMenuOpen(false)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Profile Settings
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => {
                          logout()
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    // User is not logged in - show sign in/up buttons
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
                      <Link href="/auth/login">
                        <Button variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/resgister">
                        <Button className="w-full bg-slate-800 hover:bg-slate-900" onClick={() => setIsMobileMenuOpen(false)}>
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
