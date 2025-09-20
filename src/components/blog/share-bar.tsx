// "use client";
// import { useState } from "react";
// import { Twitter, Facebook, Linkedin, Link as LinkIcon, MessageCircle } from "lucide-react";

// export default function ShareBar({ url, title }: { url: string; title: string }) {
//   const [copied, setCopied] = useState(false);
//   const enc = (s: string) => encodeURIComponent(s);

//   const links = {
//     x: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
//     fb: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
//     li: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
//     wa: `https://api.whatsapp.com/send?text=${enc(title + " " + url)}`,
//   };

//   const copy = async () => {
//     try {
//       await navigator.clipboard.writeText(url);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1500);
//     } catch {}
//   };

//   const baseBtn =
//     "inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 bg-white shadow-sm hover:shadow transition";

//   return (
//     <div className="flex items-center gap-2">
//       <a className={baseBtn} href={links.x} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
//         <Twitter className="w-4 h-4" />
//       </a>
//       <a className={baseBtn} href={links.fb} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
//         <Facebook className="w-4 h-4" />
//       </a>
//       <a className={baseBtn} href={links.li} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
//         <Linkedin className="w-4 h-4" />
//       </a>
//       <a className={baseBtn} href={links.wa} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
//         <MessageCircle className="w-4 h-4" />
//       </a>
//       <button onClick={copy} className={baseBtn} aria-label="Copy link">
//         <LinkIcon className="w-4 h-4" />
//         {copied && <span className="sr-only">Copied</span>}
//       </button>
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import { FaXTwitter, FaFacebookF, FaLinkedinIn, FaWhatsapp, FaLink } from "react-icons/fa6";

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = (s: string) => encodeURIComponent(s);

  const links = {
    x: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    li: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    wa: `https://api.whatsapp.com/send?text=${enc(title + " " + url)}`,
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const baseBtn =
    "inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:text-white hover:shadow-md transition";

  return (
    <div className="flex items-center gap-3">
      <a
        className={`${baseBtn} hover:bg-black`}
        href={links.x}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        <FaXTwitter className="w-4 h-4" />
      </a>
      <a
        className={`${baseBtn} hover:bg-blue-600`}
        href={links.fb}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
      >
        <FaFacebookF className="w-4 h-4" />
      </a>
      <a
        className={`${baseBtn} hover:bg-blue-700`}
        href={links.li}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <FaLinkedinIn className="w-4 h-4" />
      </a>
      <a
        className={`${baseBtn} hover:bg-green-500`}
        href={links.wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp className="w-4 h-4" />
      </a>
      <button
        onClick={copy}
        className={`${baseBtn} hover:bg-slate-700`}
        aria-label="Copy link"
      >
        <FaLink className="w-4 h-4" />
        {copied && (
          <span className="ml-2 text-xs font-medium text-slate-500">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
