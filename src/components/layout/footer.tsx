import { FC } from "react";

const Footer: FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Logo */}
        <div className="mb-4 md:mb-0 flex items-center">
          <img
            src="/mlsimport-logo.webp"
            alt="mlsimport logo"
            className="h-8 w-auto mr-2"
          />
        </div>
        <div className="text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} Crown Coastal Homes. All rights reserved.
        </div>
        <nav className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" className="text-sm hover:text-gray-400">Privacy Policy</a>
          <a href="#" className="text-sm hover:text-gray-400">Terms of Service</a>
          <a href="#" className="text-sm hover:text-gray-400">Contact Us</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
