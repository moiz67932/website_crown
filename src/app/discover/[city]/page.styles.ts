export const citySearchWidgetStyles = {
  container: "backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-strong max-w-2xl mx-auto",
  title: "text-2xl font-semibold text-brand-midnightCove mb-4 text-center",
  form: "flex flex-col sm:flex-row items-center gap-3",
  inputContainer: "relative w-full",
  mapPinIcon: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400",
  input: "pl-10 pr-3 py-3 text-base border-brand-silverMist/70 focus:ring-brand-pacificTeal focus:border-brand-pacificTeal w-full rounded-lg bg-white text-brand-graphitePeak",
  button: "w-full sm:w-auto bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white px-8 py-3 rounded-lg",
  searchIcon: "h-5 w-5 mr-2",
  browseLinkText: "text-xs text-gray-500 mt-3 text-center",
  browseLink: "text-brand-pacificTeal hover:underline",
};

export const cityPageStyles = {
  // Common
  section: "mb-12 sm:mb-16",
  sectionTitle: "text-3xl font-bold text-brand-midnightCove mb-8 text-center",
  sectionTitleSpaced: "text-3xl font-bold text-brand-midnightCove mb-10 text-center",
  sectionTitleWithBorder: "text-2xl font-semibold text-brand-midnightCove mb-6 border-b-2 border-brand-goldenHour pb-2",
  whiteCard: "bg-brand-white p-6 sm:p-8 rounded-xl shadow-medium",
  propertyGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8",
  
  // Page Container
  pageContainer: "bg-[#F6EEE7] min-h-screen",
  mainContent: "max-w-screen-xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8",

  // Hero Section
  heroSection: "relative h-[60vh] min-h-[400px] sm:min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden",
  heroImage: "object-cover",
  heroOverlay: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent",
  heroContent: "relative z-10 max-w-3xl mx-auto px-4",
  heroTitle: "text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight font-heading text-brand-white shadow-text",
  heroSubtitle: "text-lg sm:text-xl text-gray-100 max-w-xl mx-auto shadow-text",

  // Intro & Search Section
  introSection: "mb-12 sm:mb-16 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center",
  introTextContainer: "lg:col-span-3 p-6 sm:p-8 rounded-xl shadow-medium",
  introTitle: "text-3xl font-bold text-brand-midnightCove mb-4",
  introText: "text-gray-700 leading-relaxed whitespace-pre-line",
  introSearchContainer: "lg:col-span-2",

  // Map Section
  mapSectionTitle: "text-3xl font-bold text-brand-midnightCove mb-6 text-center",

  // Neighborhoods Section
  neighborhoodCategoryContainer: "mb-10",
  neighborhoodGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8",
  neighborhoodCardLink: "group block",
  neighborhoodCard: "bg-brand-white rounded-xl shadow-medium overflow-hidden transition-all duration-300 hover:shadow-strong",
  neighborhoodImageContainer: "relative h-56",
  neighborhoodImage: "object-cover transition-transform duration-300 group-hover:scale-105",
  neighborhoodImageOverlay: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
  neighborhoodName: "absolute bottom-4 left-4 text-xl font-semibold text-white font-heading",
  neighborhoodContent: "p-5",
  neighborhoodDescription: "text-sm text-gray-600 mb-3 h-16 overflow-hidden text-ellipsis",
  neighborhoodExploreLink: "inline-flex items-center text-brand-pacificTeal font-medium group-hover:underline",
  exploreArrowIcon: "h-4 w-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-1",

  // Market Trends Section
  marketTrendsGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
  marketTrendCard: "bg-brand-californiaSand/50 p-5 rounded-lg text-center shadow-subtle",
  marketTrendIcon: "h-10 w-10 mx-auto mb-3 text-brand-pacificTeal",
  marketTrendValue: "text-2xl font-bold text-brand-graphitePeak",
  marketTrendMetric: "text-sm text-gray-600 mb-1",
  marketTrendChangeBase: "text-xs font-semibold",
  marketTrendChange: {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  } as Record<string, string>,
  marketTrendFootnote: "text-xs text-gray-500 mt-6 text-center",

  // Facts Section
  factsGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  factCard: "flex items-start p-4 bg-brand-californiaSand/50 rounded-lg",
  factIcon: "h-8 w-8 text-brand-pacificTeal mr-4 mt-1 flex-shrink-0",
  factTitle: "text-lg font-semibold text-brand-graphitePeak",
  factValue: "text-gray-700",

  // Testimonials Section
  testimonialsGrid: "grid grid-cols-1 md:grid-cols-3 gap-8",
  testimonialCard: "bg-brand-white p-6 rounded-xl shadow-medium flex flex-col",
  testimonialRatingContainer: "flex mb-3",
  testimonialStarIcon: "h-5 w-5",
  testimonialStar: {
    filled: "text-brand-goldenHour fill-brand-goldenHour",
    empty: "text-gray-300",
  },
  testimonialQuoteIcon: "h-8 w-8 text-brand-pacificTeal/30 mb-3",
  testimonialQuote: "text-gray-600 italic mb-4 flex-grow",
  testimonialAuthor: "font-semibold text-brand-graphitePeak",
  testimonialLocation: "text-sm text-gray-500",

  // Property Listings Preview Section
  propertiesButtonContainer: "text-center mt-10",
  propertiesViewAllButton: "bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white",
  propertiesSearchIcon: "h-5 w-5 mr-2",

  // FAQ Section
  faqAccordion: "w-full",
  faqTrigger: "text-lg text-left hover:text-brand-pacificTeal text-brand-graphitePeak",
  faqContent: "text-gray-700 leading-relaxed pt-2",
}; 