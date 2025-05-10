"use client";
import { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const Navbar: FC = () => {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 flex justify-between items-center p-2  shadow-md z-50 ${
        isAtTop ? "bg-opacity-0" : "bg-white"
      }`}
    >
      <div className="text-lg font-bold">RealEstate.com</div>
      <nav className="space-x-4">
        <a href="#" className="text-xs text-gray-700 hover:text-black">Buy</a>
        <a href="#" className="text-xs text-gray-700 hover:text-black">Rent</a>
        <a href="#" className="text-xs text-gray-700 hover:text-black">Sell</a>
        <a href="#" className="text-xs text-gray-700 hover:text-black">Agents</a>
      </nav>
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-gray-700" />
        <a href="#" className="text-xs">Sign In</a>
        <Button className="ml-1">List Property</Button>
      </div>
    </header>
  );
};

export default Navbar;
