import { FC } from "react";
// import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";

const Footer: FC = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo, Description, Social */}
          <div className="flex flex-col items-center md:items-start">

            <div className="flex items-center justify-center gap-4">
            <img
              src="/logo.svg"
              alt="logo"
              className="h-24 w-24 mb-4 bg-gray-200 object-contain rounded"
            />
                 <img
              src="/mlsimport-logo.webp"
              alt="mlsimport logo"
              className="h-24 w-24 mb-4 p-2 bg-gray-200 object-contain rounded"
            />
            </div>
             
            <p className="mb-4 text-center md:text-left text-sm text-gray-200">
              Your premier partner for luxury coastal real estate in California. Discover exceptional homes and unparalleled service.
            </p>
            {/* <div className="flex space-x-4">
              <a href="#" aria-label="Facebook" className="hover:text-gray-400"><FaFacebookF /></a>
              <a href="#" aria-label="Instagram" className="hover:text-gray-400"><FaInstagram /></a>
              <a href="#" aria-label="Twitter" className="hover:text-gray-400"><FaTwitter /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-gray-400"><FaLinkedinIn /></a>
            </div> */}
          </div>
          {/* EXPLORE */}
          <div>
            <h3 className="mb-4 font-bold text-lg tracking-wider">EXPLORE</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-400 text-sm">Home</a></li>
              <li><a href="#" className="hover:text-gray-400 text-sm">Listings</a></li>
              <li><a href="#" className="hover:text-gray-400 text-sm">Neighborhoods</a></li>
            </ul>
          </div>
          {/* COMPANY */}
          <div>
            <h3 className="mb-4 font-bold text-lg tracking-wider">COMPANY</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-400 text-sm">About Us</a></li>
              <li><a href="#" className="hover:text-gray-400 text-sm">Careers</a></li>
              <li><a href="#" className="hover:text-gray-400 text-sm">Blog</a></li>
            </ul>
          </div>
          {/* SUPPORT */}
          <div>
            <h3 className="mb-4 font-bold text-lg tracking-wider">SUPPORT</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-400 text-sm">Contact</a></li>
              <li><a href="#" className="hover:text-gray-400 text-sm">FAQ</a></li>
              <li><a href="#" className="hover:text-gray-400 text-sm">Help Center</a></li>
            </ul>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} Crown Coastal Homes. All rights reserved.
          </div>
          <div className="mt-2 md:mt-0">
            Designed with <span className="text-pink-400">♥</span> in California
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
