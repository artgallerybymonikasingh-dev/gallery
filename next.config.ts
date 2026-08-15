import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images are pre-converted to WebP and stored in Supabase Storage.
    // Keeping optimization off avoids using any of Vercel's free-tier
    // image optimization quota.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Admin photo uploads can exceed the 1MB default before WebP conversion.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
