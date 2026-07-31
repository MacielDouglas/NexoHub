import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@prisma/adapter-pg"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
