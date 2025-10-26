import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*amazon.com',
      },
    ],
  },
};

export default nextConfig;
