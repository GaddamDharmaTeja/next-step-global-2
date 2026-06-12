import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  transpilePackages: ["@workspace/api-client-react", "@workspace/api-zod"],
  async rewrites() {
    return [
      { source: "/user-portal/:path*", destination: "/" },
      { source: "/admin/:path*", destination: "/" },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(projectRoot, "src"),
    };

    return config;
  },
};

export default nextConfig;
