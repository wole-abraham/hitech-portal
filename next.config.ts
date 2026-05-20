import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.3.5', '10.38.119.110'],
  experimental: {
    proxyClientMaxBodySize: '100mb',
  },
};

export default nextConfig;
