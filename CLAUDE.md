@AGENTS.md
@PROJECT_OVERVIEW.md

## Bu dosyanın amacı
AGENTS.md ve PROJECT_OVERVIEW.md yukarıda import edildi — asıl mühendislik kuralları
ve indeks oralarda. Buradaki notlar sadece Claude Code'a özel, tekrar etmeyen
operasyon talimatlarıdır. Bu dosya tek başına yeterli olmalı: buradaki kuralları
izleyen bir ajan, önceki konuşmaları bilmeden aynı kalitede iş çıkarabilmeli.

## Dil
- Kullanıcıyla iletişim Türkçe. Kod, commit mesajı ve teknik terimler İngilizce
  kalabilir.

## Çalışma düzeni — kim ne yapar
- **İki dosya:** [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) YALNIZCA açık (henüz
  yapılmamış) işleri tutar; [IMPROVEMENT_LOG.md](IMPROVEMENT_LOG.md) tamamlanan
  dilimlerin tarihli uygulama notlarının kronolojik arşividir — **projenin hafızası
  LOG'dur** (2026-08-29 ayrımı; PLAN token maliyetini düşürmek için yalın tutulur).
- İşler dilim dilim (slice) yürür: her dilim öncesi kısa plan sun, onay al, sonra
  uygula. Onaysız dilime başlama.
- Kod değişikliğini sen yaparsın; **commit, push ve deploy'u KULLANICI yapar.**
  Sen dilim sonunda hazır `git add` (dosya listesiyle) + `git commit` komutu verirsin.
- Commit mesajı sonuna trailer: `Co-Authored-By: Claude <model adı> <noreply@anthropic.com>`
- **Bir dilim bitince:** (1) maddeyi IMPROVEMENT_PLAN.md'den ÇIKAR; (2) tarihli
  uygulama notunu IMPROVEMENT_LOG.md'nin sonuna EKLE — ne yapıldı, neden, nasıl
  doğrulandı, ne kaldı (kullanıcıda bekleyen kubi/deploy adımları dahil). Yeni açık
  iş çıktıysa PLAN'a madde olarak yaz. Tamamlanan notu PLAN'a geri yazma.

## Stage ve test disiplini (KESİN KURAL)
- Deneme/test/doğrulama YALNIZCA kişisel stage'de:
  `export AWS_PROFILE=ceyhunlar-prod && npx sst dev --stage kubi`
  (Profil adı yanıltıcı: tek AWS hesabı var; `ceyhunlar-prod` profili kubi stage için
  de kullanılır.)
- `prod` ve `dev` stage'lerine deploy/test YAPMA. `prod` zaten `protect: true` +
  `removal: "retain"` ile korunuyor.
- DB: kubi ve diğer non-prod stage'ler **Neon** kullanır (SST Secret:
  `NeonDatabaseUrl`/`NeonDirectUrl`); prod **RDS** kullanır (RDS Proxy yalnız prod).
- Runtime doğrulaması gerektiren adımları (kubi'de sayfa/uç test etme, deploy)
  kullanıcıya bırak; ne test edeceğini madde madde net yaz.
- `npx sst diff --stage prod` READ-ONLY'dir, hiçbir şey uygulamaz — prod'a gidecek
  değişikliği önceden göstermek için kullanılabilir.

## Genel operasyon kuralları
- Migration gerektiren bir şema değişikliği öneriyorsan, migration dosyasını kendin
  oluşturmadan önce planı göster ve onay iste.
- `infra/` altında `prod` stage `protect: true` ve `removal: "retain"` ile korunuyor.
  Bu stage'i etkileyebilecek bir infra değişikliği yapmadan önce mutlaka planı göster.
- PROJECT_OVERVIEW.md'nin "Bilinen Doküman/Kod Sapmaları" bölümündeki noktalarda
  AGENTS.md/ARCHITECTURE.md'ye değil, gerçek koda güven.
- Büyük refactor (birden fazla feature/package'ı etkileyen) önerilerinde önce kısa bir
  plan sun, onay almadan uygulamaya başlama.
- Secret'lar `sst.Secret` ile taşınır; secret adları PascalCase'dir (`NeonDatabaseUrl`
  gibi). `.env` değişken adlarını (`RDS_PASSWORD` gibi) secret adı olarak kullanma.

## Domain ve env
- Canlı test domaini `ceyhunlarplastik.xyz`; ileride `ceyhunlarplastik.com.tr`'ye
  geçilecek. Domain'i ASLA hardcode etme — `DOMAIN` env'inden türet (infra ve
  next.config bunu zaten yapıyor).
- `.env` stage-özel config taşır ve SİLİNEMEZ: `AWS_REGION` zorunlu
  ([config.ts](config.ts) yoksa exception atar), `DOMAIN` infra genelinde kullanılır
  (API domain adları, cognito, cors, frontend). kubi `.env`'indeki `DOMAIN` bir
  placeholder'dır; gerçek değer prod deploy ortamında verilir.

## Definition of Done — bir dilim "bitti" demeden önce
Sırayla çalıştır (CI'daki bloklayıcı adımların lokal karşılığı):
1. Backend'e dokunduysan: `npm run typecheck:backend`
2. Frontend'e dokunduysan: `npm run typecheck -w frontend`
3. `npm run lint -w frontend` → **0 error şart**; mevcut warning'ler (~116,
   çoğu `no-explicit-any`) tolere edilir, yeni error ekleme.
4. Testler: `npm run test:ci -w @ceyhunlarweb/core` ·
   `npm run test -w @ceyhunlarweb/functions` · `npm run test -w frontend`
5. i18n kataloglarına dokunduysan: `messages/tr.json` ve `en.json` anahtar sayısı
   eşit olmalı.
6. Kullanıcıya teslim: değişen dosya listesi + hazır commit komutu + kubi'de
   adım adım doğrulama talimatı + (gerekiyorsa) deploy sonrası notlar.

## Bilinen tuzaklar (pahalıya öğrenilmiş dersler — tekrar etme)
- `next build`'i sst olmadan çalıştırırsan "Collecting page data" aşamasında
  "SST links are not active" hatasıyla düşer — bu BEKLENEN bir durumdur ve senin
  değişikliğinle ilgisizdir. "Compiled successfully" satırı modül çözümleme/derleme
  doğrulaması için yeterli sinyaldir. Tam build yalnız `sst shell` içinde çalışır.
- Root `tsc`'yi HER ZAMAN `--noEmit` ile çalıştır (`npx tsc --noEmit -p tsconfig.json`): bayraksız çalışınca kaynak
  klasörlerine binlerce `.js` yazar (yaşandı, 2026-09-30: 2.337 dosya; vitest testleri iki kez koşturdu ve bayat `.js`
  yanlış kırmızı verdi). Temizlik: `.ts`/`.tsx` kardeşi olan izlenmeyen `.js`'leri sil.
- Root `npx tsc -p tsconfig.json` ~12k hata üretir — tamamı `.sst/platform`
  @types/node kaskadıdır. Infra dosyası değişikliğinde çıktıyı dokunduğun dosyalara
  grep'le filtrele; infra `typecheck:backend` kapsamında DEĞİLDİR.
- Frontend'den core'a `@ceyhunlarweb/core/...` paket importu ÇALIŞMAZ (core ham TS
  yayınlar, Turbopack exports map'ini çözemez). Frontend'den core'a erişim için
  tsconfig alias'ları kullan: `@core/*` → `packages/core/src/core/*`,
  `@core-prisma/*` → `packages/core/prisma/*`. Relative `../../../core/...` yazma.
- `validatorWrapper` `additionalProperties: true`'yu YALNIZ kök şemaya uygular; iç
  `queryStringParameters` / `body` objeleri KATI kalır (`z.toJSONSchema` →
  `additionalProperties: false`). Query parametresi gönderen bir route'a genel
  `idValidator`'ı verme — gönderilen her ekstra param 400 üretir. Route'un kabul
  ettiği query alanlarını açıkça beyan eden kendi validator'ını yaz.
- Validator şemasında `.default()`, ancak alan bir union'ın DIŞINDAysa işe yarar.
  `z.discriminatedUnion` dalındaki ya da `.nullish()`/`.nullable()` ile sarılmış bir
  objenin içindeki `default`'u ajv uygulayamaz ve `strict: true` altında şemayı hiç
  derlemez (`strict mode: default is ignored for: …`). `lambdaHandler` validator'ı MODÜL
  YÜKLENİRKEN derlettiği için tek bozuk şema, o `actions.ts`'teki TÜM endpoint'leri
  import anında düşürür — hata da çoğu zaman bozuk şemayı DEĞİL, o dosyadaki ilk
  fonksiyonu gösterir. Varsayılanı şemaya değil, tek bir normalize fonksiyonuna koy
  (`normalizeProductModel3dConfig` örneği). Koruma:
  `packages/functions/src/validatorCompilation.test.ts` tüm validator'ları derler.
- İstek şemasında `.refine()` / `.superRefine()` ile doğrulama KURMA: `validatorWrapper`
  YALNIZ `z.toJSONSchema` çıktısını üretir, Zod runtime'ı istek yolunda hiç çalışmaz ve
  refinement JSON Schema'ya çevrilemediği için sessizce DÜŞER (hata da vermez). Ölçüldü:
  `z.email().max(320)` → `format:"email"` + `pattern`; `z.string().max(320).refine(...)`
  → yalnız `{type:"string",maxLength:320}` — sunucu her string'i kabul eder. Opsiyonel
  e-posta gibi durumlarda union yaz: `z.union([z.literal(""), z.email().max(320)])`.
  Koruma: `packages/functions/src/AdminApi/validators/leadCustomers.test.ts`.
- `$transaction(async (tx) => …)` İÇİNDE **global `prisma` istemcisini KULLANMA** —
  yalnız `tx`. Global istemciyle yapılan sorgu transaction'ın bağlantısını
  kullanmaz, AYRI bir bağlantı açar; Neon'da o el sıkışma 5 sn'lik interaktif
  transaction sınırını aşıp P2028 verir (yaşandı: tedarikçi sözlüğü `create`,
  kubi 2026-08-26 — `toRow` içindeki kullanım sayımı global `prisma` ile
  yapılıyordu). Gösterim amaçlı sayım/okumaları transaction DIŞINA al; transaction
  yalnız tekillik kontrolü + yazma içersin. Ayrıca transaction içindeki
  gidiş-dönüş sayısını düşük tut: yüksek gecikmeli bağlantıda her sorgu süreye
  eklenir.
- Harici HTTP çağrısını (Google Places gibi) `prisma.$transaction` İÇİNDE yapma:
  varsayılan 5 sn'lik interaktif transaction süresi ağ gecikmesiyle aşılır (P2028) ve
  tüm iş geri alınır; servis kapalıysa akış hiç tamamlanamaz. Çözümü önce hazırla,
  transaction'a yalnız yazma bırak (`prepareApprovedBusinessRequestAddresses` örneği).
- İstek şemasında `z.record(z.enum([...]), …)` KULLANMA: `z.toJSONSchema` her anahtarı
  `required` yapar ve request validator'ın ajv'si (`strict: true`) şemayı hiç derlemez
  (`strictRequired`). Doğrusu `z.partialRecord(...)` — bilinmeyen anahtarı ve değer
  kısıtlarını (max length vb.) yine uygular.
- Response validator'ı handler'ın çıktısıyla senkron tutmak TypeScript'in İŞİ DEĞİL:
  Zod şeması bağımsız bir bildirimdir, handler'ın dönüş tipiyle bağlı değildir. Bir
  alanı helper'ın sonucundan kaldırıp şemadan kaldırmazsan derleme ve tüm testler
  yeşil kalır, uç ise çalışma zamanında "Response object failed validation" ile 500
  verir (yaşandı: `createdVersions`, ayrıca customers ve productVariantSuppliers).
  Koruma: helper'ın dönüş TİPİYLE yazılmış bir fixture'ı `transpileSchema` ile
  doğrulayan test — `AdminApi/functions/productVariantMatrix/responseShape.test.ts`.
  Böyle bir testi `validators/` altına KOYMA: `validatorCompilation.test.ts` orayı
  `import.meta.glob(..., { eager: true })` ile tarıyor ve suite'in o testin içine de
  kaydolur.
- Bir handler'a response validator eklerken handler `apiResponseDTO` kullanmalı —
  `apiResponse` Date'leri ISO'ya normalize etmez, validator "must be string" ile
  patlar. Response şemaları `.loose()` olmalı (relation'lar tolere edilir).
  Prisma `Decimal` alanları JSON'da `{s,e,d}` objesi olarak serialize olur.
- Lambda 6MB senkron yanıt limiti yalnız BUFFERED API Gateway Lambda'ları için
  geçerlidir; frontend server `aws-lambda-streaming` kullanır, ona uygulanmaz.
- Toplu yazmada satır başına `update`/`upsert` ÜRETME: Prisma'nın varsayılan transaction
  zaman aşımı 5 sn'dir ve birkaç bin round-trip bunu aşar (P2028, prod'da yaşandı).
  Satır başına FARKLI değer yazılacaksa `updateMany` işe yaramaz (tek değer yazar),
  `createMany` de mevcut satırı güncellemez. Doğrusu `$executeRaw` +
  `UNNEST(dizi1, dizi2, …)` ile tek ifade (+ `ON CONFLICT DO UPDATE`), 500'lük parçalar.
  Aynı ifadede aynı çakışma anahtarı iki kez bulunamaz.
- Müşteri fiyat zinciri İKİ YERDE uygulanıyor: core
  `pricing/customerPricing.ts` (backend) ve frontend
  `customerPortal/pricing/portalDraftPricing.ts` (portal taslak/tablo). Fiyat
  kuralı değiştiriyorsan İKİSİNİ birden güncelle, yoksa portalın gösterdiği fiyat
  ile sunucunun hesapladığı fiyat ayrışır. Zincir: özel fiyat → kampanya/genel
  iskonto (büyük olan) → liste.
- Stage'ler FARKLI BÖLGELERE gidiyor ve hesap kotaları bölge başınadır: prod
  `eu-central-1` (Lambda eşzamanlılık kotası 1000), kubi/dev `eu-west-1` (kota
  **10**, üstelik başka projelerle paylaşılıyor). `.env`'de `eu-central-1`
  yorumlanmış, aktif olan `eu-west-1`. Kota/limit doğrularken HANGİ BÖLGEYE
  baktığını yaz — IMPROVEMENT_LOG'daki (P2.5) "kota 1000 (doğrulandı)" notu
  eu-central-1'e bakmıştı ve reserved concurrency'yi tüm stage'lere uygulayınca
  kubi deploy'u `UnreservedConcurrentExecution below its minimum value of [10]`
  ile düştü. Eşzamanlılık rezervasyonu gibi kota tüketen ayarları stage'e göre
  koşullandır (`$app.stage === "prod"`).
- Repoda prettier config'i YOK ve kod elle 4 boşluk girintiyle yazılmış. `npx prettier --write`
  çalıştırma: varsayılan 2 boşluğa çevirip küçük bir değişikliği yüzlerce satırlık diff'e dönüştürür.
- shadcn `SelectTrigger` varsayılanı `w-fit`'tir; ızgara/flex sütununu doldurması gerektiğinde
  `className="w-full"` vermeyi unutma, yoksa alan içeriğe göre daralır.
- `DialogContent`'e öneksiz `max-w-*` VERME: tailwind-merge primitive'in
  `max-w-[calc(100%-2rem)]`'sini siler, dialog telefonda ekran kenarına yapışır — `sm:max-w-*`
  kullan. Uzun formlu dialogda yükseklik sınırı + kayan gövde şart, yoksa başlık ve Kaydet butonu
  ekran dışına taşar (desen: `EditCustomerProfileDialog` / `LeadCustomerProfileDialog` — içerik
  `flex max-h-[…100dvh…] flex-col p-0`, gövde `min-h-0 flex-1 overflow-y-auto`, sabit footer,
  bölümler ortak `features/admin/shared/components/DialogFormSection`). İçinde `sticky` öğe olan
  kutuda `overflow-hidden` değil `overflow-clip` kullan: hidden kendi scroll bağlamını kurar ve
  sticky öğe dış scroll'a yapışmaz.
- Görsel kart ızgarasında sütun sayısını EKRAN kırılımına (`sm/lg/2xl:grid-cols-*`) bağlayıp
  `aspect-square` görsel KULLANMA: dialog/panel gibi sabit genişlikli kapta kart = kap / sütun
  olur ve görseller devleşir (kullanım alanı seçicisi, 1120px dialogda ~257px kare). Kabın
  genişliğine göre `grid-cols-[repeat(auto-fill,minmax(Xrem,1fr))]` + sabit yükseklikli görsel
  alanı kullan; `next/image` `sizes`'ını da kartın gerçek genişliğine göre ver.
- Görsel doğrulama için başsız Chrome kullanılabilir (`--headless=new --screenshot`, ayrı
  `--user-data-dir`, kendi CSS'i için build çıktısı `.next/static/chunks/*.css`). macOS'ta
  pencere ~500px'in altına İNMEZ: `--window-size=390,…` sayfayı daha geniş dizip görüntüyü
  kırpar. Telefon genişliği için sayfayı 390px genişliğinde bir `<iframe>` içinde aç. Süreç
  bazen kapanmaz — bir bekçi süresiyle çalıştır. Recharts grafikleri statik çizimde (`renderToStaticMarkup`)
  hiç çizilmez; başsız Chrome'da da animasyon ilerlemediği için çubuklar BOŞ görünür (hata değil).
  Grafiği görmek için bileşeni `esbuild` ile küçük bir sayfaya paketle (`--tsconfig` frontend'inki) ve
  kopyada `isAnimationActive={false}` ver (2026-09-28, üretim 5.2). Paketlenen sayfa HTTP istemcisini
  içe alıyorsa tarayıcıda `process is not defined` ile boş kalır: HTML'e bundle'dan önce
  `<script>window.process={env:{}}</script>` koy. Dialog / React Query kullanan bileşeni
  `QueryClientProvider` ile sar.
- Recharts 3 `Legend` öğeleri ADA göre sıralar (`itemSorter` varsayılanı `"value"`): açıklama çubuk /
  çizgi sırasından kopar. Seri sırası için `<ChartLegend … itemSorter={null} />`.
- Çok sütunlu form ızgarasında shadcn `FormItem` (`grid gap-2`) satır yüksekliğine GERİLİR ve fazla yüksekliği
  kendi satırlarına dağıtır: aynı satırda açıklaması ya da doğrulama hatası olan bir alan varken diğerlerinin
  etiketi ve kutusu aşağı kayar. Izgaraya `items-start` (ya da alana `content-start`) ver. `Label` de
  `flex leading-none` ve satır KAYDIRMAZ: "ad (birim) (opsiyonel)" gibi etiket dar sütunda yan alanın üstüne taşar
  — sütunu genişlet ya da etikete `flex-wrap` ver (`features/production/shared/components/FormNumberField` örneği).
- Görsel kontrolde `.next` CSS'ini kullanıyorsan yeni eklediğin Tailwind sınıfları o CSS'te YOKTUR (Tailwind yalnız
  derleme anında kodda geçen sınıfları üretir): değişiklikten sonra `next build`'i yeniden çalıştır, yoksa düzeltme
  ekranda "işe yaramamış" görünür.
- Client component'e ham API objesi / büyük DTO'yu prop olarak geçme — RSC flight
  payload'una serialize olup tarayıcıya iner (6MB/performans sınıfının kök nedeni).
  Server'da daralt/grupla, client'a görüntülenecek kadarını ver.
- SST `Realtime` bileşeninin `endpoint`'i ŞEMASIZ bir host adıdır. Lambda'da `IoTDataPlaneClient`'a
  böyle verilirse AWS SDK v3 `TypeError: Invalid URL` atar (yerelde ölçüldü, 2026-09-28; mevcut iki
  yayıncı bu yüzden muhtemelen hiç yayın yapmıyordu). `iotDataEndpointUrl` ile `https://` ekle.
  Realtime'ı `link` etmek `iot:Publish`'i `*`'a açar; dar izin için uç noktayı env ile ver, izni
  konu ARN'ine yaz.
- Tarayıcıda `useSession()`'ın `idToken`'ı aynı sekmede kendiliğinden YENİLENMEZ. Uzun ömürlü
  bağlantılar (MQTT / Realtime) jetonu her bağlantıda `getSession()` ile taze almalı ve süresi
  dolmadan yenilemeli (`features/realtime/lib/realtimeSubscription.ts`). Yoksa bağlantı bir saat
  sonra hata vermeden susar.
