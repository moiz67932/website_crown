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
    <div className="space-y-3">
      <h3 className="font-medium text-lg">Connect With Us</h3>
      <div className="flex flex-wrap gap-3">
        {socialLinks.map((social) => (
          <Link
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow us on ${social.name}`}
            className={`flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 text-slate-600 transition-colors ${social.color} hover:text-white`}
          >
            {social.icon}
          </Link>
        ))}
      </div>
      <p className="text-sm text-slate-500">Follow us for the latest property listings and real estate news</p>
    </div>
  )
}
