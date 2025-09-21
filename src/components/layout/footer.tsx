import { FC } from "react";
import Image from "next/image";
import Notices from "@/components/legal/Notices";

const Footer: FC = () => {
  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900 text-white pt-16 pb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gold-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo, Description, Social */}
          <div className="flex flex-col items-center md:items-start">

            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-4 w-full mb-6">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105">
                <img
                  src="/logo.png"
                  alt="Crown Coastal Homes"
                  className="h-16 w-16 object-contain transition-all duration-300"
                />
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105">
                <img
                  src="/crmls.webp"
                  alt="CRMLS"
                  className="h-14 w-14 object-contain"
                />
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105">
                <img
                  src="/exp-realty-logo.webp"
                  alt="EXP Realty"
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
             
            <p className="mb-6 text-center md:text-left text-neutral-300 leading-relaxed max-w-sm">
              Your premier partner for luxury coastal real estate in California. Discover exceptional homes and unparalleled service with Crown Coastal Homes.
            </p>
            <div className="flex justify-center md:justify-start space-x-4 w-full">
              <a href="https://www.instagram.com/crown.coastal/" aria-label="Instagram" className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-110 group">
                <Image src="/client/instagram.png" alt="Instagram" width={24} height={24} className="group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a href="https://www.linkedin.com/in/reza-barghlameno-252b1ab0/" aria-label="LinkedIn" className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-110 group">
                <Image src="/client/linkedin.ico" alt="LinkedIn" width={24} height={24} className="group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a href="https://www.homes.com/real-estate-agents/reza-barghlameno" aria-label="Homes.com" className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-110 group">
                <Image src="/client/homes.ico" alt="Homes.com" width={24} height={24} className="group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a href="https://www.zillow.com/profile/RezaSoCal" aria-label="Zillow" className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-110 group">
                <Image src="/client/zillow.png" alt="Zillow" width={24} height={24} className="group-hover:scale-110 transition-transform duration-300" />
              </a>
            </div>
          </div>
          {/* EXPLORE */}
          <div>
            <h3 className="mb-6 font-display text-xl font-bold text-gradient-luxury bg-clip-text text-transparent">Explore</h3>
            <ul className="space-y-4">
              <li><a href="/" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Home</a></li>
              <li><a href="/properties" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Listings</a></li>
              <li><a href="/neighborhoods" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Neighborhoods</a></li>
            </ul>
          </div>
          {/* COMPANY */}
          <div>
            <h3 className="mb-6 font-display text-xl font-bold text-gradient-luxury bg-clip-text text-transparent">Company</h3>
            <ul className="space-y-4">
              <li><a href="/about" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">About Us</a></li>
              <li><a href="/services" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Services</a></li>
              {/* <li><a href="#" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Blog</a></li> */}
            </ul>
          </div>
          {/* SUPPORT */}
          <div>
            <h3 className="mb-6 font-display text-xl font-bold text-gradient-luxury bg-clip-text text-transparent">Support</h3>
            <ul className="space-y-4">
              <li><a href="/contact" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Contact</a></li>
              <li><a href="/sell" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Sell Your Home</a></li>
              {/* <li><a href="/faq" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">FAQ</a></li> */}
              {/* <li><a href="#" className="text-neutral-300 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-1 inline-block">Help Center</a></li> */}
            </ul>
          </div>
        </div>
        {/* Enhanced Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-neutral-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Crown Coastal Homes. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 text-neutral-400 text-sm">
            <span>Designed with</span>
            <span className="text-gold-400 animate-pulse-soft text-lg">♥</span>
            <span>in California</span>
          </div>
        </div>
        <Notices />
      </div>
    </footer>
  );
};

export default Footer;
