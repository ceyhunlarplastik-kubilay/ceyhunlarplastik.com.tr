# Çözülmüş Vakalar (bu repoda, dosya referanslarıyla)

Yeni bir performans sorununda önce buraya bak: aynı sınıftan bir vaka çözülmüş
olabilir — helper'ı/deseni yeniden kullan, yeniden icat etme. Ayrıntılı tarihçe
IMPROVEMENT_PLAN.md'de (P1.8 bölümü + panel ilk-yük notları).

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
