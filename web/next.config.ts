import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Optimize for faster loading
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
  },
  // Reduce initial bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
