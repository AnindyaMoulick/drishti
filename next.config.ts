import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow testing from phones on the same Wi-Fi network during development
  allowedDevOrigins: ["192.168.1.14", "192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
