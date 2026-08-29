---
name: page-performance
description: >-
  Bu monorepo'da (SST v3 + Next.js App Router) yavaş açılan sayfaları, ağır
  payload'ları ve ağır sayfa ağırlığını, projenin kanıtlanmış ölçüm + waterfall
  teşhis yöntemi ve çözüm desenleriyle (static/ISR render modu, görsel
  optimizasyonu, slim DTO/_count, tıkla-getir detay, RSC-first initialData,
  lazy alt-ağaç/BFF, refetch disiplini, bundle erteleme) teşhis edip çözer.
  Kullanıcı bir sayfanın "yavaş açıldığını", "geç yüklendiğini", "ağır
  olduğunu", spinner'da takıldığını söylediğinde; payload/boyut/6MB/413/
  RequestEntityTooLarge/502'den, RSC flight payload'dan, TTFB/LCP/cold
  start'tan, CDN/cache'ten, görsel boyutundan, bundle ağırlığından
  bahsettiğinde; ya da herhangi bir panel veya public sayfanın ilk yükünü
  "optimize et / hızlandır / analiz et" dediğinde — "performans" kelimesini
  hiç kullanmasa bile — MUTLAKA bu skill'i kullan.
---

# Sayfa Performansı: Teşhis ve Çözüm

Bu skill, projede pahalıya çözülmüş vakaların damıtılmış yöntemidir: Lambda 6MB
payload / prod 502 ailesi, `/musteri` panel ilk-yük yavaşlığı, ve public katalog
(ana sayfa + kategori) yavaşlığı. Amaç: aynı analizleri sıfırdan yapmamak ve
çözümü repo'nun mevcut idiomlarıyla üretmek. Dosya-dosya döküm için
[references/case-studies.md](references/case-studies.md) oku — benzer bir sorunla
karşılaşınca önce orada çözülmüş hali var mı diye bak.

**Altın kural:** Kök nedeni tahmin etme, ÖLÇ. Bu repoda "yavaş" denen sayfaların
kök nedeni her seferinde beklenenden farklı çıktı (bir kere render modu, bir kere
tek bir görsel). Ölçmeden kod okumaya başlarsan yanlış katmanı optimize edersin.

## Aşama 0 — Canlıdan ölç (önce bunu yap, ~60 saniye)

Public bir sayfa için canlı prod (`ceyhunlarplastik.xyz`) tek komutla kök nedeni
daraltır. Kod okumaya BUNDAN SONRA geç.

```bash
URL="https://ceyhunlarplastik.xyz/<yol>"
# 1) TTFB + boyut — ardışık istek soğuk/sıcak farkını ayırır
for i in 1 2 3 4; do
  curl -s -o /dev/null -w "ttfb:%{time_starttransfer}s total:%{time_total}s boyut:%{size_download}b\n" "$URL"
done
# 2) Render modu kanıtı (EN ÖNEMLİ SATIR)
curl -s -D - -o /dev/null "$URL" | grep -iE "x-cache|cache-control|age:"
```

Okuma tablosu:

| Gözlem | Anlamı | Git |
|---|---|---|
| `cache-control: private, no-cache, no-store` + her istekte `x-cache: Miss` | Sayfa **dynamic** — CDN'de cache YOK, her istek Lambda'ya | **P7** (en büyük kaldıraç) |
| `s-maxage=..., stale-while-revalidate=...` + `x-cache: Hit` | ISR/static çalışıyor ✅ | Sunucu tarafı tamam, aşağı bak |
| İlk 1-2 istek 3-5s, sonrakiler <1s | Lambda **cold start** (prod'da VPC + Prisma init) | P7 ile CDN'e taşı; kalırsa infra (arm64/memory/warm) |
| TTFB düşük ama sayfa yavaş hissettiriyor | Sunucu değil **transfer ağırlığı** | **P8** — mutlaka toplam ağırlığı ölç |

**Toplam sayfa ağırlığını ölç (P8 için şart).** TTFB iyiyken "hâlâ yavaş"
deniyorsa kök neden neredeyse her zaman burada:

```bash
curl -s "$URL" > /tmp/p.html
node -e "
const fs=require('fs'),https=require('https');
const d=fs.readFileSync('/tmp/p.html','utf8');
const host=new URL(process.argv[1]).host;
const js=[...new Set([...d.matchAll(/src=\"(\/_next\/static\/[^\"]+\.js)\"/g)].map(m=>m[1]))];
const raw=[...new Set([...d.matchAll(/\/(logos|services)\/[a-zA-Z0-9._-]+/g)].map(m=>m[0]))];
const get=p=>new Promise(r=>{let n=0;https.get({host,path:p,headers:{'accept-encoding':'br, gzip'}},s=>{s.on('data',c=>n+=c.length);s.on('end',()=>r(n))})});
(async()=>{
  let j=0; for(const p of js) j+=await get(p);
  console.log('HTML:',(Buffer.byteLength(d)/1024).toFixed(0),'KB | JS:',js.length,'chunk',(j/1024).toFixed(0),'KB');
  for(const p of raw){ console.log('  HAM görsel (next/image DEĞİL):',p,(await get(p)/1024).toFixed(0),'KB'); }
})();
" "$URL"
```

`/_next/image?...` ile geçenler optimize; **doğrudan `/logos/...` referansı görürsen
o dosya ham iniyor** → P8.

**Endpoint payload'unu ölç** (hangi API baskın, tahmin etme):

```bash
curl -s -o /dev/null -w "byte:%{size_download} ttfb:%{time_starttransfer}s\n" \
  "https://api.ceyhunlarplastik.xyz/<route>?locale=tr"
```

## Aşama 1 — Teşhis: zinciri kanıtla

Aşama 0 katmanı daralttıktan sonra ilgili zinciri uçtan uca OKU:

1. **Render modu (önce bu):** `page.tsx` `searchParams` alıyor mu? Ağaçta
   Suspense'siz `useSearchParams`/nuqs var mı? `export const revalidate` var mı?
   Bunlar `x-cache`/`cache-control` gözlemini kodda doğrular.
2. **Veri zinciri:** `page.tsx` → client component → hook → api fn →
   `lib/http/client.ts` → `infra/*Api.ts` route → handler → repository include.
   Her dosyayı gerçekten aç; "muhtemelen şöyledir" deme.
3. **İlk boyadan önceki HTTP round-trip'leri say.** Spinner süresi bunların
   TOPLAMIDIR: shell → JS hydrate → session fetch(ler) → API → DB. next-auth v4
   `SessionProvider` (session prop'suz) public sayfada bile `/api/auth/session`
   round-trip'i açar.
4. **İndirilen vs render edilen alanları karşılaştır.** En sık kök neden: sayfa
   yalnız birkaç alan kullanırken API tam relation ağacı gönderiyor. Teknik:
   `grep -oE "value\.[a-zA-Z]+" | sort -u` ile bileşenlerin gerçekte okuduğu
   alanları çıkar, repository include'uyla kıyasla.
5. **Aynı veri iki kez mi geliyor?** Server component prop olarak veriyor + client
   hook aynı endpoint'i tekrar çekiyor olabilir (`initialData` yoksa kesin çeker).
6. **Dev-ortam çarpanını ayır.** `sst dev --stage kubi` = Live Lambda (IoT tüneli)
   + Next dev compile → lokal ölçüm prod'dan her zaman kötüdür. Yapısal teşhisi
   süreyle değil round-trip SAYISI + BYTE ile yap.

Teşhis çıktısı: sıralı kök neden listesi, her biri dosya:satır kanıtıyla + Aşama 0
sayıları. Kullanıcı sorun tarifi yaptıysa önce bu raporu sun; düzeltmeye onayla geç
(CLAUDE.md dilim disiplini).

## Aşama 2 — Çözüm desenleri (repo idiomlarıyla)

Kaldıraç sırasıyla: **P7 → P8 → P1 → P4 → diğerleri.**

**P7 — Route'u static/ISR'e geri kazan (public sayfalarda en büyük kaldıraç):**
Dynamic route = her istek cold-start riskli tam SSR + CDN cache yok. Sayfayı
static/ISR yapınca TTFB Lambda yerine CDN hızına düşer (ölçüldü: 5s → 0.05s).
İki tipik bailout ve çözümü:
- `page.tsx` `searchParams` prop'u alıyor → prop'u KALDIR; param'ı zaten client olan
  bileşen `window.location`/`useSearchParams` ile kendi okusun. `params` +
  `setRequestLocale(locale)` + `export const revalidate = 60` ekle.
- Ağaçta Suspense'siz `useSearchParams`/nuqs kullanan client bileşen → o alt-ağacı
  `<Suspense fallback={...}>` ile sar. Suspense YOKSA bailout TÜM route'u dynamic
  yapar ve `export const revalidate` sessizce yok sayılır.
Örnek: `app/[locale]/(public)/page.tsx` (searchParams kaldırıldı),
`urun-kategori/[slug]/page.tsx` (filtre bileşenleri Suspense'e alındı).

**P8 — Görsel/asset ağırlığı (TTFB iyiyken "hâlâ yavaş"ın 1 numaralı sebebi):**
Ölçüldü: bir sayfada tek görsel toplam ağırlığın **%87'siydi** (5.75MB).
- **CSS `background-image` `next/image`'ı TAMAMEN bypass eder** — WebP/AVIF,
  responsive boyut ve lazy-load devreye girmez, ham dosya iner. Tara:
  `grep -rn "backgroundImage:" app components features`. Çözüm: `next/image`
  (`fill` + `sizes` + uygun `quality`; fold altındaysa `priority` VERME).
  İstisna: `background-attachment: fixed` parallax efekti next/image ile birebir
  taşınamaz — dosya küçükse (≲100KB) olduğu gibi bırak.
- **Kaynak dosya boyutunu da küçült.** `next/image` kullanılsa bile devasa kaynak
  (ör. 12111×3530 / 5.5MB) optimizer Lambda'sını yorar. sharp mevcut:
  `sharp(src).resize({width:2560, withoutEnlargement:true}).jpeg({quality:80, mozjpeg:true, progressive:true})`
  → tam-genişlik dekoratif arka plan için 2560px fazlasıyla yeter (ölçüm: %94 küçülme).
- **`fill` kullanan her `<Image>`'a `sizes` ver.** Yoksa Next `100vw` varsayıp
  srcset'ten en büyük adayı seçer; küçük kartlarda bu çarpan etkisi yapar
  (marquee gibi children'ı çoğaltan yapılarda görsel sayısı kadar katlanır).
- Dekoratif görselde `alt=""` + `aria-hidden="true"`.

**P1 — DTO daralt (backend/payload tarafında en yüksek kazanç):**
Sayfanın render ETMEDİĞİ veriyi indirme. Sayaç için `_count`, tek alan için dar
`select`'li repository metodu yaz — mevcut include'u koşulla daraltmak yerine AYRI
metod tercih et (davranışı bozmaz, tip güvenliği net).
Örnekler: `customers/repository.ts` → `getCustomerPricingContext`,
`getCustomerPortalOverview`; `products/repository.ts` → `listProducts(query, { view: "card" })`.
**Frontend'de de yapılabilir:** backend'e hiç dokunmadan, cache'li server fn'in
sonucunu client'a geçmeden önce daralt (translations/timestamp at, kullanılmayan
code'ları filtrele). Ölçüm: 1246KB → 329KB. Bkz. `getAssistantAttributes`.

**P2 — Liste slim + detay tıkla-getir:**
Liste yüzeyi hafif DTO alır; satıra tıklanınca tam detay ayrı endpoint'ten gelir.
Örnek: admin ürünleri — liste card view, `EditProductDialog` açılışta `useProduct(id)`.

**P3 — Gruplama/dönüştürmeyi server'a taşı:**
Client `useMemo`'da yüzlerce satırı gruplamak = tüm satırlar RSC flight payload'una
serialize olup tarayıcıya iner. Saf server helper'a çıkar, client'a grup sayısı kadar
veri geç. Örnek: `features/public/products/utils/groupVariantMeasurements.ts`.
DB-side gruplama (string_agg) DENEME.

**P4 — RSC-first + `initialData` (spinner'ı öldür):**
İlk veri RSC'de çekilir, client'a prop geçer, hook `initialData` alır → client fetch
gitmez. Public veride `unstable_cache(fn, [key], { revalidate: 60 })` + React `cache()`;
**auth'lu veride `unstable_cache` KULLANMA** (token bağlamı), `protectedServerClient()`
kullan. Hata → `null` dön ve client fetch'ine zarif düş; Next kontrol-akışı hatalarını
(`error.digest` taşıyanlar) catch'te YUTMA.
Örnekler: `getPortalCustomerOverview` + `/musteri/page.tsx`;
`getCategoryProducts` + `ProductFilterList` (cold-start'lı API çağrısı ISR üretimine amortize oldu).
**initialData guard'ı ŞART:** yalnız filtresiz/varsayılan görünüme uygula
(`page===1 && !search && !filters`), aksi halde filtre değişince yeni query key'e
yanlış veri seed edersin.
ÖNEMLİ SIRA: önce P1 ile DTO'yu daralt, sonra P4 — slim'lenmemiş DTO'yu prop geçmek
CLAUDE.md'deki flight-payload tuzağının ta kendisidir.

**P9 — Ağır alt-ağacı lazy'e al (BFF route handler):**
Bir veri kümesi yalnız belirli bir adımda/etkileşimde gerekiyorsa ilk HTML'den çıkar.
Desen: `app/api/<alan>/<şey>/route.ts` route handler + cache'li server fn'i yeniden
kullan (ilave upstream fetch YOK) + `Cache-Control: public, s-maxage=60,
stale-while-revalidate=300` + client'ta `useQuery({ enabled })`.
Örnek: `app/api/assistant/usage-areas/route.ts` + `useUsageAreaValues(enabled)` —
302KB ilk HTML'den çıktı (1246KB → 26KB eager). `enabled`'ı gerçek ihtiyaç anına
bağla (modal otomatik açılıyorsa `open && step>=1` gibi).

**P5 — Refetch disiplinini payload'a göre seç:**
MB-sınıfı yanıta `refetchOnMount: "always"` / `refetchOnWindowFocus: true` verme;
global default'lar (staleTime 60sn, focus kapalı) doğrudur. Yeni hook yazarken
agresif ayarları eski hook'tan kopyalama.

**P10 — Bekleme HİSSİNİ düzelt (ölçüm iyiyken bile gerekir):**
Payload/TTFB düzeldiği hâlde "yavaş" deniyorsa sorun genelde **geri bildirim yokluğudur**.
Üç ayrı olay, üç ayrı mekanizma — karıştırma:
- **Rota navigasyonu** (linke tıklama): `loading.tsx` (rota iskeleti) + `template.tsx`
  (geçiş animasyonu) + global `NavigationProgress` (tıklama anında, navbar/dropdown'ın
  ÜSTÜNDE). `template.tsx` yeni sayfa MOUNT olunca çalışır — bekleme sırasında DEĞİL;
  `loading.tsx` iskeleti içerik alanındadır, tam-ekran dropdown açıkken görünmez.
- **Yerinde refetch** (filtre/arama/sayfalama): önceki içeriği ekranda tut
  (`placeholderData: (prev) => prev`) + liste kabına `absolute inset-0` **bölüm-yerel**
  overlay (`ProductListLoadingOverlay`). `pointer-events-none`, `role="status"`,
  `aria-live="polite"`, sarmalayıcıda `aria-busy`, `AnimatePresence`, `useReducedMotion`.
- **Tetikleyici kontrol**: filtreyi tetikleyen kontrol de pending göstersin (sidebar spinner).
**Tuzak:** bölüm-seviyesi refetch için sayfa-seviyesi `fixed top-0` progress bar KULLANMA —
o slot rota navigasyonuna aittir; iki bar aynı yerde çakışır (bu repoda yaşandı).
Detay ve bileşen adları: AGENTS.md → "Established refetch-feedback pattern".

**P6 — Bundle: ağır kütüphaneyi ihtiyaç anına ertele:**
Statik import edilen ağır lib (harita, pdf, mqtt) her route'u şişirir. Hook içindeyse
type-only import + effect içinde `await import(...)` (`cancelled` bayrağıyla).
Örnek: `useRealtimeNotifications.ts` (mqtt → 352KB lazy chunk).
Ölü kodu da ara: hiç import edilmeyen büyük component'ler
(`grep -rn "ComponentAdı" --include="*.tsx" | grep -v "kendi dosyası"`).
Not: her zaman görünür bir tetikleyici butonu olan dialog'u `ssr:false` dynamic
yapmak layout-shift yaratır — tetikleyiciyi statik bırakıp yalnız içeriği ertele.

## Tuzaklar (bu değişiklik sınıfında bilinen mayınlar)

CLAUDE.md "Bilinen tuzaklar" geçerli; bu iş özelinde en kritikleri:

- **`initialData` verirken hydration mismatch:** aynı query key'i (`["categories", locale]`)
  paylaşan BAŞKA bir bileşen `initialData` almıyorsa, server (veri yok) ↔ client
  (cache dolu) HTML'i uyuşmaz → "Hydration failed". Bir query key'e initialData
  veriyorsan o key'in TÜM tüketicilerini grep'le ve hepsini aynı kaynaktan besle
  (tercihen server'dan prop). Gerçek vaka: `ProductsSection` + `Footer`.
- **Paylaşılan server fn'i slim'lemeden ÖNCE tüketicileri çıkar:**
  `grep -rn "getAttributesForFilter"` → filtre/kategori/admin sayfaları tam veriye
  ihtiyaç duyuyor olabilir. Paylaşılan fn'e DOKUNMA; yanına AYRI slim fn ekle
  (`getAssistantAttributes`) ve yalnız ilgili yüzeyleri ona geçir.
- **Endpoint'e query parametresi ekliyorsan/gönderiyorsan:** `validatorWrapper` iç
  objeleri KATI bırakır — route'un kabul ettiği paramları açıkça beyan eden request
  validator yaz, genel `idValidator` verme (aksi: her istek 400).
- **Response shape'i değiştiriyorsan:** hedef response validator'ın iç objelerinin
  `.loose()` olup olmadığına BAK; katıysa endpoint'e kendi şemasını ver. İddiayı AJV
  ile kanıtla (geçici `tsx` script + `ajv/dist/2020`, göster, sil).
- **6MB limiti yalnız BUFFERED API Gateway Lambda'larına uygulanır** — frontend server
  `aws-lambda-streaming` (kapsam dışı).
- **Client component server dosyasından tip import etmesin** — paylaşılan tipi
  `types.ts`'e taşı (`ProductListPayload` gibi).
- Yavaşlığı loglarken hata objesini `console.error("x:", {...})` diye basma — Next
  overlay `{}` gösterebilir; tek satır string + `response.data` ekle.
- **Kullanılmayan font weight'leri yükleme:** `app/fonts.ts`'te tanımlı her weight
  indirilir. Gerçek kullanımı grep'le (`font-light`, `font-extrabold`...) ve listeyi
  ona indir; ayrıca CSS'te istenip yüklenmeyen weight sessiz bir bug'dır.

## Aşama 3 — Doğrulama

1. CLAUDE.md Definition of Done'ın tamamı (tsc'ler, lint 0 error, testler, build
   "Compiled successfully").
2. **Performans-özel kanıt — Aşama 0 komutlarını tekrar çalıştır ve önce/sonra
   sayılarını yan yana raporla.** ("daha hızlı hissettiriyor" YETMEZ):
   - `cache-control`/`x-cache`: `no-store` → `s-maxage`/`Hit` oldu mu (P7)
   - HTML boyutu, hedef endpoint byte'ı, ham görsel byte'ı düştü mü
   - İlk boyadan önceki istek sayısı düştü mü (session/çift fetch gitti mi)
   - Static/ISR iddiası için: `sst shell -- next build` route tablosunda sayfa
     `○/●` mi (dynamic `ƒ` değil). Not: SST'siz `next build` "Collecting page
     data"da düşer — "Compiled successfully" satırı derleme kanıtı olarak yeterlidir.
3. kubi runtime doğrulama adımlarını kullanıcıya madde madde yaz; regresyon listesine
   AYNI hook/endpoint/component'i kullanan DİĞER yüzeyleri dahil et (tüketici listesini
   grep'le çıkar — ör. slim DTO sonrası `/urunler/filtre` hâlâ tüm filtreleri
   gösteriyor mu).
4. IMPROVEMENT_LOG.md'ye tarihli uygulama notu ekle: ne yapıldı, neden, ölçülen
   önce/sonra sayıları, ne kaldı (LOG projenin hafızasıdır; açık kalan iş varsa
   IMPROVEMENT_PLAN.md'ye madde olarak yaz).
