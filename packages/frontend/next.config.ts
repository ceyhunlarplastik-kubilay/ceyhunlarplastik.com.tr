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
  // `app/global-not-found.tsx`: proje `app/[locale]/layout.tsx` (dinamik üst
  // segment) + `app/(panels)/layout.tsx` şeklinde İKİ ayrı "kök" layout
  // taşıyor, ortak tek bir `app/layout.tsx` yok. Next.js dokümantasyonu tam
  // bu durumu (birden fazla kök layout / üst segmentte dinamik param) normal
  // iç içe `not-found.tsx`'in YETERSİZ kaldığı, `global-not-found` gerektiren
  // senaryo olarak tanımlıyor — iç içe `not-found.tsx` yalnız route içinde
  // `notFound()` ÇAĞRILDIĞINDA devreye girer, dosya sisteminde HİÇ eşleşmeyen
  // bir path (ör. /urunler/olmayan-bir-sayfa) için değil; o durumda kök
  // `app/not-found.tsx`/`global-not-found.tsx` gerekir.
  experimental: {
    globalNotFound: true,
  },
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
