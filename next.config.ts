// /next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ensure environment variables are loaded
  env: {
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  },

  images: {
    // We still keep unoptimized true, but Next/Image will
    // continue to enforce allowed remote domains/patterns.
    unoptimized: true,
    remotePatterns: [
      // Public GCS bucket with your pre-rendered property images
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**", // <-- IMPORTANT: must start with a slash
      },
      // Direct Trestle image URLs (kept for any listings that still use them)
      {
        protocol: "https",
        hostname: "api-trestle.corelogic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.crmls.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
