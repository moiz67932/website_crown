import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    // Using unoptimized images in component, but keep remotePatterns for any future optimized usage
  unoptimized: true, // disable Next.js optimizer globally to silence upstream fetch errors during dev
    remotePatterns: [
      { protocol: 'https', hostname: 'api-trestle.corelogic.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'media.crmls.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  
};

export default nextConfig;
