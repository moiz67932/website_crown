import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const baseConfig: NextConfig = {
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
  assetPrefix: process.env.CDN_URL || undefined,
  
};
const withPwa = withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  skipWaiting: true,
});

export default withPwa(baseConfig);
