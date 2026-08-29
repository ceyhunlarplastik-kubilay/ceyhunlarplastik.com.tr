# Çözülmüş Vakalar (bu repoda, dosya referanslarıyla)

Yeni bir performans sorununda önce buraya bak: aynı sınıftan bir vaka çözülmüş
olabilir — helper'ı/deseni yeniden kullan, yeniden icat etme. Ayrıntılı tarihçe
IMPROVEMENT_LOG.md'de (P1.8 bölümü + panel ilk-yük notları + "Ana sayfa / Kategori
sayfası / Ürün detay sayfası performansı" başlıkları).

## Vaka 1 — Lambda 6MB payload sınıfı (prod 502 ailesi, P1.8)

**Belirti:** Prod'da `/urun/[slug]` 502; admin listelerinde 413
(RequestEntityTooLarge); "sayfa bazen açılmıyor".

**Kök neden sınıfı:** Full-include Prisma sorguları → dev DTO'lar → buffered
API Gateway Lambda'sının 6MB senkron yanıt limiti. Ölçülmüş referans:
full-include ürün ~175KB/adet.

**Çözüm envanteri:**
- Public variant-table güvenli DTO + dedup/paginate helper'ı:
  `packages/core/src/core/helpers/products/dedupeVariantTable.ts` (public +
  customer handler'ları paylaşır), `mapPublicProductVariantTableRow.ts`
  (`mapVariantTableStructure` ortak yapı; public fiyatsız, customer +listPrice).
- Veri sınırı (B0): public yanıtı fiyat/tedarikçisiz; müşteri fiyatı ayrı
  ProtectedApi endpoint'i `GET /portal/customer/products/{id}/variant-table`
  (`getCustomerProductVariantTableHandler` — müşterinin indirimi de bu yanıtta,
  `customerDiscountPercent`). Admin/sales tam tedarikçi verisini KENDİ
  yüzeylerinden alır (`/satis/urunler` → `GET /sales/variant-prices`) — ortak
  tabloya admin endpoint'i EKLEME, mevcut yüzeyler karşılıyor.
- Admin ürün listesi: `listProducts(query, { view: "card" })`
  (`listProductsHandler.ts`) + `EditProductDialog` açılışta `useProduct(id)`
  ile full fetch.
- Server-side gruplama (F1.2):
  `packages/frontend/features/public/products/utils/groupVariantMeasurements.ts`
  — `ProductVariantTable` artık ham satır değil `options` (gruplanmış) alır.
- Sessiz truncation: variant-table `normalizeListQuery`'de `maxLimit: 500`;
  hata/empty ayrımı `{ variants, error }` kontratı + `loadError` prop'u.
- İzleme: `infra/observability.ts` — RequestEntityTooLarge LogMetricFilter +
  alarm (yalnız buffered ürün Lambda'ları; streaming frontend hariç).

**Bu vakadan çıkan mayın:** variant-table isteklerinde `limit` gönderilir →
route'ların validator'ı `productVariantTableRequestValidator` (PublicApi
validators/products.ts). `idValidator`'a döndürme — 400 regresyonu yaşandı.

## Vaka 2 — /musteri panel ilk-yük yavaşlığı (4 dilim)

**Belirti:** Panel ana sayfası ilk açılışta uzun spinner.

**Teşhis (kanıtlanmış waterfall):** boş RSC shell → hydrate → SessionProvider
session fetch → axios interceptor'da HER istekte ikinci `getSession()` HTTP
round-trip'i → `GET /portal/customer` = `customerDetailInclude` tam ürün
ağaçları (sayfa ürün RENDER ETMİYOR, yalnız `.length` sayaçları) → MB JSON.

**Çözüm envanteri (dilim sırası ÖNEMLİ — önce DTO, sonra RSC-first):**
1. Slim endpoint: `GET /portal/customer/overview` —
   `customerPortalOverviewInclude` (= base + portalUsers + addresses +
   `_count{featuredProducts, assignedProducts}`; ürün ağacı YOK),
   `getCustomerPortalOverviewHandler` (crm/handlers.ts; `_count` spread'e
   sızmadan ayrıştırılır; count'lar customer objesi İÇİNDE — `customerSchema`
   `.loose()` kabul ediyor, AJV ile kanıtlandı).
2. Token cache: `packages/frontend/lib/http/client.ts` — module-level id-token
   cache (JWT `exp` - 60sn), single-flight, 401'de invalidation. Tüm
   admin+protected istekleri kapsar; YENİ client eklersen aynı deseni kullan.
3. RSC-first: `features/customerPortal/server/getPortalCustomerOverview.ts`
   (React `cache()` + `protectedServerClient`, `unstable_cache` YOK, `digest`
   hataları yutulmaz, hata→null) → `/musteri/page.tsx` async, hook
   `initialData` alır → spinner'sız dolu ilk boya + hatada client-fetch'e düşüş.
4. Refetch disiplini: `usePortalCustomer`'dan `refetchOnMount:"always"` +
   focus refetch kaldırıldı; `providers.tsx` Devtools `initialIsOpen: false`.

**Ölçüm teknikleri (yeniden kullan):**
- Render edilen alanları çıkarma: bileşen dosyalarında
  `grep -oE "customer\.[a-zA-Z]+" | sort -u` → repository include'uyla kıyasla.
- RSC payload kontrolü: DevTools → document yanıtında alan-adı araması
  (ör. gruplama server'a taşındıysa `versionCode` HİÇ geçmemeli).
- Validator kanıtı: repo kökünde geçici `tsx` script'i — `ajv/dist/2020`
  (draft-2020 şart; düz `ajv` patlar), `coerceTypes: true`, validator'ı import
  et, örnek yanıtı doğrula, `RESULT ...` satırı bas, script'i sil.

## Vaka 3 — Public katalog: ana sayfa + kategori sayfası (2026-07-25)

**Belirti:** "Ana sayfa geç açılıyor", sonra "hâlâ biraz yavaş".

**Bu vakanın ana dersi:** Kök neden iki kez de beklenen yerde ÇIKMADI. Önce
render modu (kod okumakla değil, canlı `cache-control` header'ıyla bulundu),
sonra tek bir görsel (payload/bundle analizinde hiç görünmüyordu). **Aşama 0
ölçümü yapılmadan kod okumaya başlamak yanlış katmanı optimize ettirir.**

### 3a — Ana sayfa

**Aşama 0 ölçümü (önce):** TTFB soğuk **5.0s** / warm 0.75s, HTML **1.66MB**,
`cache-control: private, no-cache, no-store` + `x-cache: Miss` → sayfa dynamic.

**Kök nedenler ve çözümler:**
1. **Render modu (P7):** `page.tsx` `searchParams` alıyordu → route dynamic,
   CDN cache yok. `searchParams` kaldırıldı, `params` + `setRequestLocale` +
   `export const revalidate = 60`; error param'ını `HomeToasts` client'ta
   `window.location`'dan okuyor. → TTFB **5s → 0.05s**, `x-cache: Hit`.
2. **Attributes over-fetch (P1+P9):** `/product-attributes/with-values` =
   **1246KB** (9 code, 1087 value, 2192 translation). Sayfa yalnız 3 code +
   value başına 5 alan kullanıyordu. Paylaşılan `getAttributesForFilter`'a
   DOKUNULMADI (filtre/admin sayfaları tam veriye muhtaç); yanına
   `getAssistantAttributes` (slim) eklendi → 329KB. Sonra `usage_area` (805
   value ≈ 302KB) BFF route handler'a alındı
   (`app/api/assistant/usage-areas/route.ts` + `useUsageAreaValues(enabled)`)
   → ilk HTML'de kalan **26KB** (toplam ~%98 azalma).
3. **Kategori çift-fetch (P4):** Navbar server'da `getCategories` çekiyor,
   `ProductsSection` client'ta aynı endpoint'i tekrar çekiyordu →
   `useCategories(initialData)` + prop.
4. **Waterfall:** `NavbarServer`'da iki sıralı `await` → `Promise.all`.
5. **Ölü kod / font:** `ProductAssistant.tsx` (743 satır, hiç import edilmiyor)
   silindi; Montserrat weight `[400..800]` → `["300","800"]` (yalnız
   `font-light` + `font-extrabold` kullanılıyor; 300 hiç yüklenmediği için
   `font-light` sessizce yanlış weight'e düşüyordu).

**Sonuç:** TTFB 5s → 0.05s (CDN Hit), HTML 1.66MB → 391KB.

### 3b — Kalan yavaşlık: tek bir görsel (%87)

TTFB 0.05s olmasına rağmen "hâlâ yavaş" denildi. Toplam ağırlık ölçümü:

| Kaynak | Boyut | Pay |
|---|---|---|
| `/logos/nature.jpg` | **5747KB** | **%87** |
| JS (29 chunk) | 473KB | %7 |
| HTML | 391KB | %6 |

**Kök neden:** `Enviroment.tsx` görseli CSS `background-image` olarak
kullanıyordu → `next/image` tamamen bypass (optimizasyon/lazy yok). Kaynak
dosya ayrıca **12111×3530 / 5.48MB** idi (üstünde `bg-black/45` overlay olan
dekoratif arka plan için).

**Çözüm (P8):** kaynak sharp ile 2560×746 / 315KB'ye indirildi (%94.4) +
`next/image` (`fill`, `sizes="100vw"`, `quality={70}`, `alt=""`+`aria-hidden`,
fold altı olduğu için `priority` YOK). Beklenen toplam: ~6.6MB → ~1.0MB.
Repo taraması: dosya-referanslı tek kalan CSS background
`ProcessAndContactSection` → `hakkimizda.jpg` (64KB, `background-attachment:
fixed` parallax — bilinçli bırakıldı).

### 3c — Kategori sayfası (`urun-kategori/[slug]`)

**Ölçüm (önce):** TTFB 0.5–1.4s, HTML 1.64MB, `no-store` + `Miss` —
`export const revalidate = 60` YAZMASINA RAĞMEN dynamic.

1. **Suspense bailout (P7):** `ProductFilterSidebar` `useSearchParams`
   kullanıyor, Suspense yoktu → bailout TÜM route'u dynamic yapıyor ve
   `revalidate` sessizce yok sayılıyordu. Sidebar + list `<Suspense>`'e alındı.
2. **Attributes (P1):** `slimCategoryFilterAttributes(attributes,
   category.allowedAttributeValueIds)` — translations atılır (sidebar
   kullanmıyor), non-industrial value'lar kategorinin allowedValueIds'ine göre
   ön-filtrelenir (sidebar'ın kendi mantığıyla birebir → davranış değişmez).
   1246KB → **738KB**. Industrial code'lar korunur (sidebar onları gösteriyor).
3. **Ürün listesi (P4):** `ProductFilterList` ürünleri client'ta çekiyordu;
   `/products` warm 0.25–0.8s ama **cold 3.46s** (VPC Lambda). Payload zaten
   card-view slim'di (`listProducts(..., {view:"card"})`) → sorun payload değil,
   cold start. `getCategoryProducts` server fn + `initialProducts` prop +
   `useProducts(initialData)` → filtresiz görünümde ürünler ISR HTML'inde
   geliyor, cold start ISR üretimine amortize oluyor.
   **Guard:** `isDefaultView = page===1 && !search && !attrFilters` — yoksa
   filtre değişince yeni query key'e filtresiz veri seed edilir.

### Bu vakadan çıkan mayınlar

- **Hydration mismatch (gerçekten patladı):** `ProductsSection`'a `initialData`
  verilince, aynı `["categories", locale]` key'ini `initialData`'sız kullanan
  `Footer` server↔client uyuşmazlığı verdi. Çözüm: layout kategorileri server'da
  çekip `Footer`'a prop geçiyor, Footer client hook'unu bıraktı. **Kural:** bir
  query key'e initialData veriyorsan o key'in TÜM tüketicilerini grep'le.
- **Paylaşılan server fn'i slim'lemeden önce tüketicileri çıkar:**
  `getAttributesForFilter` 7 yüzeyde kullanılıyordu; 3 code'a indirmek
  `/urunler/filtre` + admin sayfalarını bozardı → ayrı slim fn yazıldı.
- **`fill` + `sizes` eksikliği:** marquee kartları (224px) `sizes` yokken Next
  100vw varsayıp en büyük srcset adayını seçiyordu; marquee children'ı iki kez
  render ettiği için 36 görsele çarpan etki yapıyordu.
- SST'siz `next build` "Collecting page data"da SST-links hatasıyla düşer;
  "✓ Compiled successfully" satırı derleme kanıtı olarak yeterlidir. Static/ISR
  iddiasını kanıtlamak için `sst shell -- next build` route tablosu gerekir.
