import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  // Standalone output for production Docker image (multi-stage build)
  output: "standalone",
};

export default nextConfig;
