import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for webpack module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
