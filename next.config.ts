import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bayesbond.s3.eu-north-1.amazonaws.com',
        pathname: '/**',  // allow all paths
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',  // allow all paths
      },
    ],
  },
};

export default nextConfig;
