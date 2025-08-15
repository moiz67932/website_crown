import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['storage.googleapis.com', 'media.crmls.org', 'images.unsplash.com'],
  },
};

export default nextConfig;
