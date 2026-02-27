import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set turbopack root to avoid issues with parent package.json files
  turbopack: {
    root: process.cwd(),
  },
  // Fix for PDFKit ESM __dirname issue - prevent bundling to preserve correct path resolution
  serverExternalPackages: ['pdfkit'],
};

export default nextConfig;
