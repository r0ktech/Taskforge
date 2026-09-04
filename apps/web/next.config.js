/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@taskforge/database", "@taskforge/shared"],
  // bullmq/ioredis ship optional native/alternate-client dependencies that
  // don't exist in this project; keep them external to server bundles so
  // webpack doesn't try (and fail) to resolve them.
  experimental: {
    serverComponentsExternalPackages: ["bullmq", "ioredis", "@prisma/client"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
};

module.exports = nextConfig;
