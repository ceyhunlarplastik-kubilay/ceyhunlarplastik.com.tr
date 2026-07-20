---
name: page-performance
description: >-
  Bu monorepo'da (SST v3 + Next.js App Router) yavaş açılan sayfaları ve ağır
  payload sorunlarını, projenin kanıtlanmış waterfall-teşhis yöntemi ve çözüm
  desenleriyle (slim DTO/_count, tıkla-getir detay, server-side gruplama,
  RSC-first initialData, token cache, refetch disiplini) teşhis edip çözer.
  Kullanıcı bir sayfanın "yavaş açıldığını", "çok beklediğini", spinner'da
  takıldığını söylediğinde; payload/boyut/6MB/413/RequestEntityTooLarge/502'den,
  RSC flight payload'dan, bundle ağırlığından bahsettiğinde; ya da herhangi bir
  panel veya public sayfanın ilk yükünü "optimize et / hızlandır / analiz et"
  dediğinde — "performans" kelimesini hiç kullanmasa bile — MUTLAKA bu skill'i
  kullan.
---

# Sayfa Performansı: Teşhis ve Çözüm

Bu skill, projede daha önce pahalıya çözülmüş iki vaka sınıfının (Lambda 6MB
payload / prod 502 ailesi ve `/musteri` panel ilk-yük yavaşlığı) damıtılmış
yöntemidir. Amaç: aynı analizleri sıfırdan yapmamak ve çözümü repo'nun mevcut
idiomlarıyla üretmek. Çözülmüş vakaların dosya-dosya dökümü için
[references/case-studies.md](references/case-studies.md) oku — benzer bir
sorunla karşılaşınca önce orada çözülmüş hali var mı diye bak.

## Aşama 1 — Teşhis: waterfall'u kanıtla, tahmin etme

Yavaşlık neredeyse hiçbir zaman tek sebep değildir; katmanlaşan israftır.
Zinciri uçtan uca OKU ve her halkayı kanıtla:

1. **Veri zincirini çıkar:** `page.tsx` → client component → hook → api fn →
   `lib/http/client.ts` → `infra/*Api.ts` route → handler → repository include.
   Her dosyayı gerçekten aç; "muhtemelen şöyledir" deme.
2. **İlk boyadan önceki HTTP round-trip'leri say.** Spinner süresi bunların
   TOPLAMIDIR: shell → JS hydrate → session fetch(ler) → API → DB. Session
   çağrılarını unutma: next-auth v4 `getSession()` HTTP round-trip'tir
   (`lib/http/client.ts`'te token cache var — hâlâ yerinde mi kontrol et).
3. **İndirilen vs render edilen alanları karşılaştır.** En sık kök neden:
   sayfa yalnız `.length`/birkaç alan kullanırken API tam relation ağacı
   gönderiyor. Teknik: bileşenlerde `grep -oE "customer\.[a-zA-Z]+" | sort -u`
   ile gerçekte okunan alanları çıkar, repository include'uyla kıyasla.
4. **Payload'ı ölç, sınıfını bil.** Bu repoda ölçülmüş referans: full-include
   ürün ~175KB/adet → 20'li liste ≈ 3.5MB, 100'lü liste = 413. Network
   sekmesinde gerçek byte'a bak.
5. **Dev-ortam çarpanını ayır.** `sst dev --stage kubi` = Live Lambda (IoT
   tüneli) + Next dev compile → lokal ölçüm prod'dan her zaman kötüdür.
   Yapısal teşhisi süreyle değil round-trip SAYISI + payload BYTE'ıyla yap.

Teşhis çıktısı: sıralı kök neden listesi, her biri dosya:satır kanıtıyla.
Kullanıcı sorun tarifi yaptıysa önce bu raporu sun; düzeltmeye onayla geç
(CLAUDE.md dilim disiplini).

## Aşama 2 — Çözüm desenleri (repo idiomlarıyla)

Kök nedene göre uygula; her desenin repoda çalışan örneği var:

**P1 — DTO daralt (en yüksek kazanç, önce bunu dene):**
Sayfanın render ETMEDİĞİ veriyi indirme. Sayaç için `_count`, tek alan için
dar `select`'li repository metodu yaz — dev include'u koşulla daraltmak yerine
AYRI metod tercih et (davranışı bozmaz, tip güvenliği net).
Örnekler: `customers/repository.ts` → `getCustomerPricingContext` (tek alan),
`getCustomerPortalOverview` (`_count` + ürün ağacı yok);
`products/repository.ts` → `listProducts(query, { view: "card" })`.

**P2 — Liste slim + detay tıkla-getir:**
Liste yüzeyi hafif DTO alır; satıra tıklanınca tam detay ayrı endpoint'ten
gelir. Örnek: admin ürünleri — liste card view, `EditProductDialog` açılışta
`useProduct(id)` ile full fetch (loading/error state'li shell + iç form).

**P3 — Gruplama/dönüştürmeyi server'a taşı:**
Client `useMemo`'da yüzlerce satırı gruplamak = tüm satırlar RSC flight
payload'una serialize olup tarayıcıya iner. Gruplamayı saf server helper'a
çıkar, client'a grup sayısı kadar veri geç. Örnek:
`features/public/products/utils/groupVariantMeasurements.ts` (F1.2).
DB-side gruplama (string_agg) DENEME — sorgu zaten hızlı+cache'liyken DB
CPU'suna iş yıkar; ancak materialize fingerprint kolonu (migration onaylı)
ölçekte gündeme gelir.

**P4 — RSC-first + `initialData` (spinner'ı öldür):**
Auth'lu panelde bile ilk veri RSC'de çekilebilir: `server/` klasöründe React
`cache()` + `protectedServerClient()` fn'i (auth'lu veride `unstable_cache`
KULLANMA — token bağlamı; `unstable_cache` yalnız public veri için). Sayfa
async olur, client component'e prop geçer, hook `initialData` alır. Hata →
`null` dön ve client fetch'ine zarif düş; Next kontrol-akışı hatalarını
(`error.digest` taşıyanlar) catch'te YUTMA — aynen fırlat. Örnek:
`features/customerPortal/server/getPortalCustomerOverview.ts` + `/musteri/page.tsx`.
ÖNEMLİ SIRA: önce P1 ile DTO'yu daralt, sonra P4 — slim'lenmemiş DTO'yu prop
geçmek CLAUDE.md'deki flight-payload tuzağının ta kendisidir.

**P5 — Refetch disiplinini payload'a göre seç:**
MB-sınıfı yanıta `refetchOnMount: "always"` / `refetchOnWindowFocus: true`
verme; global default'lar (staleTime 60sn, focus kapalı) çoğu profil/liste
verisi için doğrudur. Yeni hook yazarken agresif ayarları eski hook'tan
kopyalama.

**P6 — Bundle: ağır kütüphaneyi ihtiyaç anına ertele:**
Statik import edilen ağır lib (harita, pdf, mqtt) her panel route'unu
şişirir. Hook içindeyse type-only import + effect içinde `await import(...)`
(unmount yarışına `cancelled` bayrağı). Örnek:
`features/notifications/hooks/useRealtimeNotifications.ts` (mqtt → 352KB lazy chunk).

## Tuzaklar (bu değişiklik sınıfında bilinen mayınlar)

CLAUDE.md "Bilinen tuzaklar" bölümü geçerli; bu iş özelinde en kritikleri:

- **Endpoint'e query parametresi ekliyorsan/gönderiyorsan:** `validatorWrapper`
  iç objeleri KATI bırakır — route'un kabul ettiği paramları açıkça beyan eden
  request validator yaz, genel `idValidator` verme (aksi: her istek 400).
- **Response shape'i değiştiriyorsan:** hedef response validator'ın iç
  objelerinin `.loose()` olup olmadığına BAK; katıysa endpoint'e kendi
  şemasını ver. İddiayı AJV ile kanıtla (varsayma — bu repoda iki kez gerçek
  bug çıktı): repo kökünde geçici `tsx` script'i ile `ajv/dist/2020` +
  validator'ı import edip örnek yanıtı doğrula, sonucu göster, script'i sil.
- **6MB limiti yalnız BUFFERED API Gateway Lambda'larına uygulanır** —
  frontend server `aws-lambda-streaming` (kapsam dışı). Alarm/çözüm hedefini
  buna göre seç.
- Yavaşlığı loglarken hata objesini `console.error("x:", {...})` diye basma —
  Next overlay `{}` gösterebilir; tek satır string + `response.data` ekle.

## Aşama 3 — Doğrulama

1. CLAUDE.md Definition of Done'ın tamamı (tsc'ler, lint 0 error, testler,
   build "Compiled successfully").
2. Performans-özel kanıt: Network'te (a) ilk boyadan önceki istek sayısı
   düştü mü, (b) hedef endpoint'in byte'ı düştü mü, (c) spinner kalktı mı /
   kısaldı mı. Sayıları raporla ("daha hızlı hissettiriyor" yetmez).
3. kubi runtime doğrulama adımlarını kullanıcıya madde madde yaz; regresyon
   listesine AYNI hook/endpoint'i kullanan DİĞER yüzeyleri dahil et (tüketici
   listesini grep'le çıkar).
4. IMPROVEMENT_PLAN.md'ye tarihli uygulama notu ekle (plan projenin hafızası).
