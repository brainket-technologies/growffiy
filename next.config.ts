import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],
  transpilePackages: ["react-datepicker"],
  experimental: {
    turbo: {
      resolveAlias: {
        "react-datepicker/dist/react-datepicker.css": false,
      },
    },
  },
};

export default nextConfig;
