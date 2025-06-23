export const navStyles = {
  header: "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FAF4ED] py-3 md:py-4 border-b border-[#f0e9e0] shadow-sm",
  container: "container mx-auto px-4",
  navContainer: "flex items-center justify-between h-14",
  
  // Desktop Nav
  desktopNav: "hidden lg:flex items-center space-x-1 flex-1 justify-start",
  desktopNavLink: "px-3 py-2 text-sm font-medium text-slate-900 hover:text-yellow-600 transition-colors",
  desktopDropdownButton: "px-3 py-2 text-sm font-text-slate-900 font-medium hover:text-yellow-600 transition-colors focus:bg-[#13304A]",
  dropdownContent: "min-w-[260px] p-0 bg-[#FAF4ED] text-slate-900 border-none shadow-lg",
  dropdownLabel: "text-lg font-semibold px-6 py-4 text-slate-900",
  dropdownItem: "px-6 py-2 text-base hover:text-[#D4AF37]",
  
  // Logo
  logoContainer: "flex-0 flex justify-center items-center w-48 md:w-72 absolute left-1/2 transform -translate-x-1/2 lg:static lg:translate-x-0",
  logoLink: "flex items-center justify-center",
  logoImageContainer: "relative h-36 w-36 md:h-56 md:w-56 flex items-center justify-center",
  
  // Right Nav
  rightNav: "hidden lg:flex items-center space-x-6 flex-1 justify-end",
  rightNavLink: "text-slate-900 font-medium text-sm hover:text-yellow-600 transition-colors",
  loginButton: "ml-4 bg-yellow-400 text-slate-900 font-semibold px-5 py-2 rounded-full shadow-sm hover:bg-yellow-300 border-none transition-colors text-sm",
  
  // Mobile Menu
  mobileMenuButton: "lg:hidden text-slate-900 p-1",
  mobileMenuContainer: "lg:hidden bg-[#FAF4ED] border-t border-[#f0e9e0] mt-2 absolute left-0 right-0 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto z-50",
  mobileNav: "flex flex-col space-y-1",
  mobileDropdownButton: "w-full flex items-center justify-between px-3 py-2 font-medium rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors",
  mobileChevron: (isOpen: boolean) => `ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`,
  mobileDropdownContent: "ml-4 mt-1 flex flex-col space-y-1",
  mobileDropdownItem: "block px-3 py-2 text-sm rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors",
  mobileNavLink: "px-3 py-2 font-medium rounded-md text-slate-900 hover:text-[#D4AF37] hover:bg-[#13304A]/10 transition-colors",
  mobileButtonsContainer: "mt-4 flex flex-col space-y-2",
  mobileSignInButton: "justify-center w-full text-slate-900 border-slate-900 hover:bg-[#D4AF37] hover:text-[#13304A]",
  mobileListPropertyButton: "bg-[#D4AF37] hover:bg-[#bfa13a] text-[#13304A] justify-center w-full font-semibold",
}; 