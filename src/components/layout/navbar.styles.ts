export const navStyles = {
  header: "fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-neutral-100/50 dark:border-slate-700/50 shadow-soft theme-transition",
  container: "container mx-auto px-6",
  navContainer: "flex items-center justify-between h-16 lg:h-18",
  
  // Desktop Nav
  desktopNav: "hidden lg:flex items-center space-x-2 flex-1 justify-start",
  desktopNavLink: "px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 theme-transition",
  desktopDropdownButton: "px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-center gap-1 theme-transition",
  dropdownContent: "min-w-[280px] p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-neutral-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-slate-700/50 shadow-strong rounded-2xl theme-transition",
  dropdownLabel: "text-sm font-bold px-4 py-3 text-neutral-800 dark:text-neutral-200 uppercase tracking-wider border-b border-neutral-100 dark:border-slate-700",
  dropdownItem: "px-4 py-3 text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-200 theme-transition",
  
  // Logo
  logoContainer: "flex-0 flex justify-center items-center w-48 md:w-64 absolute left-1/2 transform -translate-x-1/2 lg:static lg:translate-x-0",
  logoLink: "flex items-center justify-center group",
  logoImageContainer: "relative h-12 w-32 md:h-14 md:w-40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
  
  // Right Nav
  rightNav: "hidden lg:flex items-center space-x-4 flex-1 justify-end",
  rightNavLink: "text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 px-3 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 theme-transition",
  loginButton: "ml-4 bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 text-white font-semibold px-6 py-2.5 rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 border-none text-sm hover:scale-105",
  
  // Mobile Menu
  mobileMenuButton: "lg:hidden text-neutral-700 dark:text-neutral-300 p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 theme-transition",
  mobileMenuContainer: "lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-neutral-100/50 dark:border-slate-700/50 mt-2 absolute left-0 right-0 shadow-strong max-h-[calc(100vh-4rem)] overflow-y-auto z-50 rounded-b-2xl theme-transition",
  mobileNav: "flex flex-col space-y-1 p-4",
  mobileDropdownButton: "w-full flex items-center justify-between px-4 py-3 font-semibold rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-300 theme-transition",
  mobileChevron: (isOpen: boolean) => `ml-2 h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`,
  mobileDropdownContent: "ml-4 mt-2 flex flex-col space-y-1",
  mobileDropdownItem: "block px-4 py-3 text-sm rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 font-medium theme-transition",
  mobileNavLink: "px-4 py-3 font-semibold rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-300 theme-transition",
  mobileButtonsContainer: "mt-6 flex flex-col space-y-3 p-4 border-t border-neutral-100 dark:border-slate-700",
  mobileSignInButton: "justify-center w-full text-neutral-700 border-neutral-300 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 rounded-2xl font-semibold transition-all duration-300",
  mobileListPropertyButton: "bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 text-white justify-center w-full font-bold rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105",
}; 