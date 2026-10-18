import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "ws", "kiteconnect"],
  transpilePackages: ["react-datepicker"],
};

export default nextConfig;
