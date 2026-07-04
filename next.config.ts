import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compression automatique de toutes les réponses
  compress: true,

  // Optimisation des images — conversion WebP automatique, lazy loading
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // cache 30 jours
    deviceSizes: [390, 768, 1280],
    imageSizes: [64, 128, 256, 512],
  },
};

export default nextConfig;
