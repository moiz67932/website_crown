import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react"
import Link from "next/link"

export default function SocialMediaLinks() {
  const socialLinks = [
    // {
    //   name: "Facebook",
    //   url: "https://facebook.com/yourrealestatecompany",
    //   icon: <Facebook className="h-5 w-5" />,
    //   color: "hover:bg-blue-600",
    // },
    // {
    //   name: "Twitter",
    //   url: "https://twitter.com/yourrealestatecompany",
    //   icon: <Twitter className="h-5 w-5" />,
    //   color: "hover:bg-sky-500",
    // },
    {
      name: "Instagram",
      url: "https://instagram.com/crown.coastal",
      icon: <Instagram className="h-5 w-5" />,
      color: "hover:bg-pink-600",
    },
    {
      name: "LinkedIn",
      url: "https://linkedin.com/in/reza-barghlameno-252b1ab0/",
      icon: <Linkedin className="h-5 w-5" />,
      color: "hover:bg-blue-700",
    },
    // {
    //   name: "YouTube",
    //   url: "https://youtube.com/c/yourrealestatecompany",
    //   icon: <Youtube className="h-5 w-5" />,
    //   color: "hover:bg-red-600",
    // },
  ]

  return (
    <div className="space-y-6 theme-transition">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-6 h-[2px] bg-gradient-primary rounded-full"></div>
          <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Social Media</span>
          <div className="w-6 h-[2px] bg-gradient-primary rounded-full"></div>
        </div>
        <h3 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 theme-transition">
          Connect <span className="text-gradient-primary bg-clip-text text-transparent">With Us</span>
        </h3>
        <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed theme-transition">
          Follow us for the latest luxury property listings and California coastal real estate insights
        </p>
      </div>
      
      <div className="flex justify-center gap-4">
        {socialLinks.map((social, index) => (
          <Link
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow us on ${social.name}`}
            className={`group relative flex items-center justify-center h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-400 transition-all duration-300 hover:scale-110 hover:shadow-strong ${social.color} hover:text-white hover:border-transparent theme-transition animate-fade-in-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative z-10">
              {social.icon}
            </div>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-current to-current"></div>
          </Link>
        ))}
      </div>
      
      <div className="text-center p-4 glass-card rounded-2xl border border-neutral-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400 text-sm theme-transition">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-soft"></div>
          <span className="font-medium">Stay updated with our latest listings</span>
        </div>
      </div>
    </div>
  )
}
