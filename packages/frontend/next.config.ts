import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Görsel host allowlist'i build-zamanı DOMAIN'den türetilir (.env'de mevcut).
// Böylece .xyz -> .com.tr geçişinde otomatik güncellenir; elle host yazılmaz.
// - Kişisel stage'ler (kubi): görseller {bucket}.s3.amazonaws.com'dan gelir.
// - prod: cdn.{domain} · dev: dev.{domain} — ikisi de tek-seviye subdomain,
//   `*.{domain}` ile kapsanır.
// UYARI (P1.5): optimizasyon açıkken bir görsel host'u bu listede yoksa Next
// /_next/image'e 400 döner ve resim KIRIK görünür (eskiden unoptimized:true
// yapılmasının sebebi buydu). Yeni bir asset host'u eklenirse buraya da eklenmeli.
const assetDomain = process.env.DOMAIN?.trim();

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "*.s3.amazonaws.com" },
  ...(assetDomain
    ? [{ protocol: "https" as const, hostname: `*.${assetDomain}` }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    // Asset URL'leri UUID tabanlı ve değişmez (görsel değişirse yeni URL alır),
    // bu yüzden uzun TTL güvenli: daha az tekrar-optimizasyon + daha iyi cache.
    minimumCacheTTL: 31536000, // 1 yıl
    // Next YALNIZ bu genişlikleri üretir → maliyet/kötüye-kullanım yüzeyi dar.
    // 3840 (4K) bu katalog için gereksiz, listeden çıkarıldı.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns,
  },
};

export default withNextIntl(nextConfig);
