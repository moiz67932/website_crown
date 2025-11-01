import Image from "next/image"
import Link from "next/link"
import { Button } from "../../components/ui/button"

export const metadata = {
  title: "About Us | Real Estate",
  description: "Learn more about our real estate company, our mission, and our team.",
}

export default function AboutPage() {
  return (
    <main className="pt-24 pb-16 bg-white dark:bg-slate-900 theme-transition">
      {/* Enhanced Hero Section */}
      <section className="bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900/20 py-20 md:py-24 relative overflow-hidden theme-transition">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 bg-primary-400 dark:bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent-400 dark:bg-cyan-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">About Us</span>
              <div className="w-8 h-[2px] bg-gradient-primary rounded-full"></div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-balance theme-transition">
              About Our
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Company</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed max-w-3xl mx-auto text-balance theme-transition">
              We're a dedicated team of real estate professionals committed to helping you find your perfect home.
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Our Mission */}
      <section className="py-20 md:py-24 bg-white dark:bg-slate-900 theme-transition">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-in-left">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-6 h-[2px] bg-gradient-accent rounded-full"></div>
                <span className="text-accent-600 dark:text-accent-400 font-semibold text-sm uppercase tracking-wider">Our Purpose</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 theme-transition">
                Our <span className="text-gradient-primary bg-clip-text text-transparent">Mission</span>
              </h2>
              <div className="space-y-6">
                <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed theme-transition">
                  Our mission is to provide exceptional real estate services with integrity, professionalism, and
                  attention to detail. We strive to exceed our clients' expectations and make their real estate journey
                  smooth and successful.
                </p>
                <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed theme-transition">
                  Whether you're buying your first home, selling a property, or investing in real estate, our team is here
                  to guide you every step of the way.
                </p>
              </div>
              <div className="mt-8 p-6 glass-card rounded-2xl border border-neutral-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 theme-transition">Trusted by 500+ Families</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 theme-transition">Excellence in every transaction</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="relative h-96 rounded-3xl overflow-hidden shadow-strong">
                <Image 
                  src="/luxury-modern-house-exterior.png" 
                  alt="Our modern office space" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-luxury rounded-3xl opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-accent rounded-2xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Us */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-neutral-50 via-white to-accent-50/30 dark:from-slate-800 dark:via-slate-900 dark:to-cyan-900/20 relative overflow-hidden theme-transition">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-accent-400 dark:bg-cyan-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary-400 dark:bg-orange-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-accent rounded-full"></div>
              <span className="text-accent-600 dark:text-accent-400 font-semibold text-sm uppercase tracking-wider">Our Advantages</span>
              <div className="w-8 h-[2px] bg-gradient-accent rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-balance theme-transition">
              Why Choose
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Our Team</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-balance theme-transition">
              Experience the difference of working with California's premier coastal real estate professionals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Local Expertise",
                description: "Our team has deep knowledge of the local real estate market and neighborhoods.",
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                gradient: "from-primary-500 to-primary-600"
              },
              {
                title: "Client-Focused Approach",
                description: "We prioritize your needs and work tirelessly to achieve your real estate goals.",
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                gradient: "from-accent-500 to-accent-600"
              },
              {
                title: "Proven Results",
                description: "Our track record speaks for itself with hundreds of successful transactions.",
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                gradient: "from-success-500 to-success-600"
              },
            ].map((item, index) => (
              <div 
                key={index} 
                className="group glass-card p-8 rounded-3xl hover-lift transition-all duration-500 animate-fade-in-up border border-neutral-200/50 dark:border-slate-700/50"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-4 theme-transition">{item.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed theme-transition">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Call to Action */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900 dark:from-slate-900 dark:via-slate-800 dark:to-orange-900 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gold-400 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-400 rounded-full blur-3xl animate-float animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-luxury rounded-full"></div>
              <span className="text-gold-400 font-semibold text-sm uppercase tracking-wider">Get Started</span>
              <div className="w-8 h-[2px] bg-gradient-luxury rounded-full"></div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Ready to Find Your
              <span className="block text-gradient-luxury bg-clip-text text-transparent">Dream Home?</span>
            </h2>
            <p className="text-neutral-300 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
              Browse our curated listings or get in touch with our expert team to start your California coastal real estate journey today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/properties">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-medium hover:shadow-strong hover:scale-105 hover:shadow-primary-400/25 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Browse Properties
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm rounded-2xl font-semibold transition-all duration-300 shadow-medium hover:shadow-strong hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Us
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-white/80 mt-12 animate-fade-in-up animation-delay-2000">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-400 rounded-full animate-pulse-soft"></div>
                <span className="text-sm md:text-base font-medium">500+ Happy Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gold-400 rounded-full animate-pulse-soft animation-delay-2000"></div>
                <span className="text-sm md:text-base font-medium">Expert Guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse-soft animation-delay-4000"></div>
                <span className="text-sm md:text-base font-medium">Luxury Focus</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
