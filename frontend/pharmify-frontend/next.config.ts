import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'pharmify-jugv.onrender.com', pathname: '/media/**' }],
  },
};
export default nextConfig;