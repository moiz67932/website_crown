import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['storage.googleapis.com', 'media.crmls.org'],
  },
};

export default nextConfig;
