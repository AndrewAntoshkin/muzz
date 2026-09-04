import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "akter1.ru" },
      { protocol: "https", hostname: "www.kinopoisk.ru" },
    ],
  },
};

export default nextConfig;
