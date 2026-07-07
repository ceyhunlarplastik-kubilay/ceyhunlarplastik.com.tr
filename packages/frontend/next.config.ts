import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60,
    // Bilinçli bekleyen karar (IMPROVEMENT_PLAN P1.5): OpenNext image
    // optimization maliyeti netleşene kadar optimizasyon kapalı.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
