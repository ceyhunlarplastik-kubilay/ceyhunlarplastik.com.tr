# Improvement Plan

Bu dosya, kod tabanının gerçek durumu üzerinden çıkarılmış teknik denetim bulgularını ve öncelik sıralı aksiyon planını içerir. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) ile aynı ilkeyle yazılmıştır: kısa, linkli, tekrarsız — detay için ilgili koda referans verir. Tüm bulgular bu denetimde gerçek kodda doğrulanmıştır (2026-07-07).

## Araç Envanteri (Kodda Doğrulanan)

| Katman | Araç / Sürüm | Not |
|---|---|---|
| Infra | SST Ion v3, API Gateway v2, Step Functions, EventBridge, IoT Realtime, S3, Cognito | 12 infra dosyası, `prod` protected |
| Frontend | Next.js 16.1.6, React 19.2.3, Tailwind 4, next-auth **4.24** (legacy), TanStack Query 5 / Table 8, nuqs 2, Zustand 5, motion 12 | 830 ts/tsx dosya, **425'i `"use client"` (%51)** |
| Backend | Middy 7, Zod 4 (root hoisted), http-errors, nodemailer 7 (Gmail SMTP) + SESv2 | 197 `lambdaHandler` çağrısı, 42 `actions.ts` |
| DB | Prisma 7.3 + `@prisma/adapter-pg`, RDS Postgres t4g.micro, `multiAz: false`, RDS Proxy yalnız prod | 36 model, 85 index, 60 migration |
| Test | vitest 2 (yalnız core script'te tanımlı) | **Toplam 6 test dosyası** |
| CI/CD | **YOK** — `.github/workflows` mevcut değil | Deploy manuel (`deploy:prod` script) |
| Ağır client bağımlılıkları | pdfjs-dist + react-pdf, maplibre-gl + react-map-gl, mqtt | `next/dynamic` yalnız 6 dosyada |

Ek yapı notları (dokümanlarda geçmeyen):
- `next.config.mjs` **ve** `next.config.ts` aynı anda mevcut (aynı içerik). Next `.mjs`'i yükler, `.ts` ölü kopyadır — drift riski. (Hangisinin yüklendiği runtime'da doğrulanmalı — needs confirmation.)
- [next.config.mjs](packages/frontend/next.config.mjs) `images.unoptimized: true` — Next görsel optimizasyonu tamamen kapalı. Bilinçli bir OpenNext/maliyet kararı mı, unutulmuş mu belirsiz — needs confirmation.
- [middy.ts](packages/core/src/core/middy.ts) `httpContentNegotiation` zaten `availableLanguages: ["tr-TR", "en-US"]` tanımlıyor — backend i18n için hazır ama kullanılmayan bir iskelet.

## Executive Summary

1. **CI/CD ve otomatik kalite kapısı yok** — typecheck/lint/test/audit hiçbiri otomatik çalışmıyor; prod deploy tek makineden manuel. En ucuz, en yüksek getirili düzeltme.
2. **CORS `origin: "*"` + `credentials: true`** tüm API'lerde açık ([middy.ts:100](packages/core/src/core/middy.ts)); koddaki "prod'da daraltırız" notu hiç uygulanmamış.
3. **16 dependency açığı (8 high)**: `next@16.1.6` bilinen açıklı aralıkta, `nodemailer@7` açıklı, `next-auth@4` eski `uuid` çekiyor.
4. **Supplier soft-delete kaçağı**: [prisma.ts](packages/core/src/core/db/prisma.ts) extension'ında `color` için `findUnique` override'ı var, `supplier` için **yok** — silinmiş supplier `findUnique` ile geri dönebilir.
5. **Prod alarmları sessiz + request izi sürülemiyor**: [observability.ts](infra/observability.ts) alarmları `actionsEnabled: false` — tetiklense de kimseye bildirim gitmiyor (SNS yok). Loglamada yalnız `errorLogger` aktif; requestId/korelasyon alanı olmadığı için "Failed to create product" gibi genel hataların kök nedeni CloudWatch'ta bulunamıyor (bkz. P1.6).
6. **i18n altyapısı sıfır**: kütüphane yok, `html lang="tr"` sabit, TR string kapsamı ~412 dosya (frontend 373, functions 26, core 13). Bildirimler **üretim anında TR metin olarak persist ediliyor** — bu, i18n mimarisini en çok zorlayacak nokta.
7. **SEO altyapısı eksik**: `sitemap.ts` / `robots.ts` yok, `(public)` altında 19 sayfadan yalnız 7'sinde metadata var, hreflang yok — i18n ile birlikte çözülmeli.
8. **Test kapsamı kritik derecede zayıf**: 6 test dosyası; pricing, approval policy, authMiddleware gibi para/yetki taşıyan yollar testsiz.
9. **Response validation tutarsız** (bilinen sapma, doğrulandı): 9 `actions.ts` responseValidator'sız, 2'si requestValidator'sız.
10. **Secrets `.env` üzerinden** (`RDS_PASSWORD`, `GMAIL_SMTP_APP_PASSWORD`) — SST Secret kullanılmıyor; CI olmadığı için deploy yetkisi tek geliştirici makinesine bağlı.

## Öncelikli Aksiyon Listesi

Her madde: ne / neden / etkilenen katmanlar / kapsam. Sıra, "önce güvenlik ve kırılganlık, sonra sağlamlaştırma, sonra iyileştirme" ilkesiyledir. **Hiçbir madde tek katmanı tek başına değiştirmez — etkilenen tüm katmanlar aynı PR'da güncellenir.**

### P0 — Güvenlik ve kırılganlık (hemen)

**P0.1 — CI kalite kapısı kur (GitHub Actions)** · kapsam: orta · **✅ Uygulandı (2026-07-07)**
- Ne: `typecheck + lint + vitest + npm audit` çalıştıran PR workflow'u. Deploy otomasyonu **bu fazda yok** — sadece kalite kapısı, prod'a dokunmaz.
- Neden: Sonraki tüm P0/P1 değişikliklerinin regresyon güvencesi buna dayanır. "Hiçbir şeyi bozma" kısıtının ön şartı.
- Uygulama notları: [.github/workflows/ci.yml](.github/workflows/ci.yml) eklendi; frontend'e `typecheck`/`test`, core'a `test:ci` (sst shell'siz vitest — AWS gerektirmediği lokalde doğrulandı) script'leri eklendi. Bloklayıcı: frontend typecheck + core/frontend testleri (15+13 test geçiyor). **Non-blocking başlayanlar:** lint (mevcut 1218 hata) ve audit (8 high açık, P0.3'te kapanınca bloklayıcı olacak). Backend typecheck kapsam dışı kaldı → bkz. P1.7.

**P0.2 — CORS'u stage-aware daralt** · kapsam: küçük · **✅ Uygulandı (2026-07-07; ✅ prod'a deploy edildi 2026-07-23)**
- Ne: [middy.ts:101](packages/core/src/core/middy.ts) `origin: "*"` → stage'e göre domain listesi; Bearer token kullanıldığı için `credentials: true` muhtemelen gereksiz, kaldırılmalı.
- Neden: Panel API'leri herhangi bir origin'den çağrılabilir durumda. `*` + `credentials` kombinasyonu ayrıca spec'e aykırı.
- Uygulama notları: Araştırmada asıl uygulama noktasının kod değil **API Gateway** olduğu görüldü — SST `cors` verilmeyince `allowOrigins: ["*"]` default'u devredeydi ve AWS HTTP API kuralı gereği backend CORS header'ları zaten yok sayılıyordu. Çözüm: [infra/cors.ts](infra/cors.ts) (stage-aware origin tek kaynağı: prod → domain+www, dev → dev.domain, kişisel stage'ler → localhost:3000) + dört `infra/*Api.ts`'e `cors: apiCors`. Ölü/yanıltıcı kod temizlendi: middy `httpCors` kaldırıldı, [response.ts](packages/core/src/core/helpers/utils/api/response.ts) hardcoded `*` header'ları kaldırıldı, `IApiResponse` tipi güncellendi, `@middy/http-cors` bağımlılığı silindi. Kubi stage'de doğrulandı: 4 API'de `AllowOrigins: ["http://localhost:3000"]`; izinli origin preflight'ta ACAO dönüyor, yabancı origin'e CORS header'ı dönmüyor. **Prod'a yansıması bir sonraki `deploy --stage prod` ile olur** — prod origin listesi `https://{DOMAIN}` + `https://www.{DOMAIN}`.

**P0.3 — Dependency açıklarını kapat** · kapsam: orta · **✅ Uygulandı (2026-07-07; ✅ prod'a deploy edildi 2026-07-23)**
- Ne: `next@16.1.6` → yamalı sürüme yükselt; `nodemailer` yükselt; kırıcı olmayan `npm audit fix`. `next-auth@4`'ün `uuid` açığı için `overrides` ile pin (v5 migration'ı P2'ye — bkz. P2.2).
- Neden: 8 high severity açık production bağımlılık zincirinde.
- Uygulama notları: `next` 16.1.6 → **16.2.10** (+`eslint-config-next`), `nodemailer` 7 → **9.0.3** (advisory fix sürümü; repo'nun kullandığı `createTransport`/`sendMail` yüzeyi değişmedi), `npm audit fix` ile `form-data`/`fast-uri`/`qs` kapandı. Production high sayısı 8 → 4. Doğrulama: frontend typecheck + 28 unit test + `sst shell --stage kubi` içinde tam `next build` başarılı.
- **Bilinçli kalan açıklar:** (a) 4 high — tamamı `sst@3.19.3` CLI zinciri (`opencontrol`/`hono`/`mcp-sdk`/`aws-sdk`); yalnız `sst dev` geliştirici makinesinde çalışır, Lambda bundle'ına girmez; fix SST 4.0.7+ → bkz. P2.6. (b) `next-auth`+`uuid` moderate — önerilen "fix" v3'e downgrade; uuid açığı `buf` parametreli v3/v5/v6 gerektirir, next-auth yalnız rastgele v4 üretir → sömürü yolu yok; kalıcı çözüm P2.2. `overrides` ile uuid pinleme auth zincirini kırma riski nedeniyle bilinçli yapılmadı. (c) `prisma`/`@prisma/dev` moderate — dev-server bileşeni; fix prisma 7.9+ ayrı yükseltme işi. (d) `vitest@2` critical — yalnız devDependency (Vitest UI server), CI/prod'a girmez; P1.4 test işiyle birlikte vitest 4'e yükseltilebilir. Bu kalıntılar nedeniyle CI audit job'u şimdilik non-blocking kalıyor (bkz. P1.7).

**P0.4 — Supplier soft-delete `findUnique` kaçağını kapat** · kapsam: küçük (ama davranış değişikliği) · **✅ Uygulandı (2026-07-07; ✅ prod'a deploy edildi 2026-07-23)**
- Ne: [prisma.ts](packages/core/src/core/db/prisma.ts) supplier extension'ına `findUnique` (ve `deleteMany`) override'ı ekle — `color` ile simetrik.
- Neden: Soft-delete edilmiş supplier, `findUnique` üzerinden admin/portal yüzeylerine sızabilir.
- Uygulama notları: Envanter tek çağrı noktası buldu ([suppliers/repository.ts:87](packages/core/src/core/helpers/prisma/suppliers/repository.ts)) ve restore/reactivate akışı olmadığı doğrulandı — davranış değişikliği güvenli. Uygulamada **aynı sınıftan yeni bir bug daha bulundu ve kapatıldı**: `OrThrow` varyantları ayrı Prisma operasyonlarıdır ve override edilmemişlerdi; [colors/repository.ts:80](packages/core/src/core/helpers/prisma/colors/repository.ts) `findUniqueOrThrow` kullandığı için **silinmiş renkler de id ile okunabiliyordu**. Eklenen override'lar: supplier'a `findUnique`/`findUniqueOrThrow`/`findFirstOrThrow`/`deleteMany`, color'a `findUniqueOrThrow`/`findFirstOrThrow`. Davranış: silinmiş kayıt artık var olmayan id ile aynı yolu izler (`null` / P2025) — yeni hata modu yok. Kubi lokal DB'de 6 senaryoluk davranış scripti ile doğrulandı (6/6 PASS). Ders: soft-delete extension'ı operasyon-bazlı sayım yapar; yeni bir read operasyonu (`aggregate`, `groupBy` vb.) kullanılacaksa override kapsamı kontrol edilmeli.

**P0.5 — Prod alarmlarını bildirime bağla** · kapsam: küçük · **✅ Uygulandı (2026-07-07; ✅ prod'a deploy edildi 2026-07-23)**
- Ne: SNS topic + e-posta aboneliği; [observability.ts](infra/observability.ts) alarmlarında `actionsEnabled: true` + `alarmActions`.
- Neden: Şu an prod'da Lambda concurrency tükenmesi veya frontend throttle olsa kimse haber almaz.
- Uygulama notları: `ceyhunlarweb-prod-alarms` SNS topic'i + `kubilayuysal.ceyhunlarplastik@gmail.com` e-posta aboneliği eklendi; 8 alarmın tamamında (`account concurrency` 1, frontend server 2, public ürün route'ları 6) `actionsEnabled: true` + `alarmActions` + `okActions` (düzelme bildirimi dahil). Kaynaklar yalnız prod'da yaratılır. **Prod deploy sonrası zorunlu adım:** AWS'den gelen "Subscription Confirmation" mailindeki linke tıklanmalı — tıklanmazsa bildirim gitmez ve istek 3 günde düşer. Opsiyonel uçtan uca test (deploy + onay sonrası): `aws cloudwatch set-alarm-state --alarm-name ceyhunlarweb-prod-frontend-server-lambda-throttles --state-value ALARM --state-reason "test"` → e-posta gelmeli; alarm bir sonraki değerlendirmede kendiliğinden OK'e döner ve OK maili de gelir.

**P0.6 — API route Lambda'larına aranabilir isim standardı** · kapsam: küçük kod, büyük tek-seferlik churn · **✅ Uygulandı (2026-07-07; ✅ prod'a deploy edildi 2026-07-23)** *(kullanıcı talebiyle eklendi)*
- Ne: [infra/lambdaNaming.ts](infra/lambdaNaming.ts) `apiRouteLambdaNamer(boundary)` — dört API'nin `transform.route.handler`'ına bağlandı; her route Lambda'sı `{app}-{stage}-{boundary}-{klasör}-{handler}-{hash5}` formatında fiziksel isim alır (örn. `ceyhunlarweb-prod-public-products-getProductBySlug-352a8`). Log group'lar da aynı isimden türediği için CloudWatch'ta aranabilir.
- Neden hash eki: aynı handler birden fazla route'a bağlanabiliyor (ör. `decideBusinessRequest` 3 route'ta) — hash olmadan isimler çakışır ve deploy patlar. Hash, route'un logical adından deterministik türetilir.
- Kritik bilgi: **Lambda adı create-only'dir** — isim şeması değişirse tüm route Lambda'ları yeniden yaratılır; şemayı sabit tutun. Yeni route'lar otomatik isimlenir, elle `name:` verilirse transform dokunmaz.
- Doğrulama (kubi): 202/202 route Lambda'sı yeni isimle yaratıldı, eskiler silindi, 0 çakışma, 0 64-karakter ihlali, API HTTP 200, entegrasyonlar yeni fonksiyonlara bağlı.

### P1 — Sağlamlaştırma

**P1.1 — i18n Faz 1: İngilizce desteği** · kapsam: büyük — detay aşağıda ayrı bölümde. · **Faz 1a ✅ Uygulandı (2026-07-07)**
- Faz 1a uygulama notları: `next-intl@4.13.1`; [i18n/routing.ts](packages/frontend/i18n/routing.ts) (`localePrefix: "as-needed"` + **`localeDetection: false`** — otomatik dil yönlendirmesi bilinçli kapalı, TR ziyaretçi/bot davranışı değişmedi). **Tasarım kararı — paneller `[locale]` DIŞINDA:** yalnız `(public)` + `(auth)` `app/[locale]/` altına taşındı; 9 panel dizini `app/(panels)/` route group'una alındı (URL değişmedi, ikinci root layout). Neden: [proxy.ts](packages/frontend/proxy.ts) `withAuth` matcher'ı panelleri koruyor — `[locale]` altına girselerdi `/en/admin` matcher'dan kaçar, auth bypass doğardı. proxy.ts artık intl+withAuth kompozisyonu (`/hesabim` passthrough; matcher ürün slug'ları nokta içerebildiği için genel nokta-dışlama yerine uzantı bazlı). Static rendering `setRequestLocale`+`generateStaticParams` ile korundu: 15 TR + 15 EN sayfa prerender. Kesişen düzeltmeler: `next.config.mjs` silindi (P1.5a ✅ — tek config `.ts` + intl plugin), maplibre CSS root layout'tan harita bileşenlerine taşındı (P2.1 kısmi), **hardcoded `.com.tr` metadataBase → env-driven** (canlı domain `.xyz` — OG/canonical düzeldi). Doğrulama: typecheck + full build + 7/7 route smoke + `html lang` tr/en + auth redirect birebir. Faz 2'de paneller çevrilecekse taşıma + matcher değişikliği AYNI işte yapılmalı (bkz. (panels)/layout.tsx yorumu).

**P1.2 — Validator kapsamını tamamla** · kapsam: orta · **✅ Uygulandı (2026-07-09) — 9/9 TAMAM**
- Batch 4 notu (2026-07-09): **ProtectedApi users** (son ve en büyük: 10 endpoint). **3 handler DTO'ya çevrildi** (`getUser`/`getMe`/`updateMyProfileImage` — `apiResponse` kullanıyordu, Date alanları colors'daki "must be string" tuzağını üretirdi); `mePermissions` `apiResponse`'ta bırakıldı (payload'ında tarih yok — roles/flags/can). Tek loose `userSchema` üç varyantı da karşılıyor: raw `UserWithRelations` (getUser/getMe), `mapAdminUserForApi` (+imageUrl — listUsers/getMyAccess/updateMyProfile), `mapUserWithImage` (updateMyProfileImage) → `imageUrl` nullish. `getMyAccess` payload'ı `{user, canAccessPanels}`; `listMyNotifications` `{data, meta, unreadCount}` (**unreadCount standart paginasyona ekstra**); `markMyNotificationRead` null'da 404 attığı için `{notification}` non-nullable güvenli. `UserNotification.data` (Json?) şemada bilinçli listelenmedi (her shape olabilir, loose tolere eder); `type`/`accessStatus`/`groups` permissive string. Eksik request validator'lar kapatıldı: `getUser` + `markMyNotificationRead` → `idValidator` (route'lar `{id}` taşıyor, doğrulandı). `createMyProfileImageUpload` presign → bilinçli validator'sız. Doğrulama: tsc temiz; kubi runtime kullanıcıda. **9 dosyalık P1.2 backlog'u kapandı.**
- Batch 3 notu (2026-07-09): **AdminApi productMeasurements + PublicApi productVariantSuppliers + OwnerApi users**. Üçü de `apiResponseDTO` ✅. `productMeasurements`: repo'nun TÜM metotları `include:{measurementType:true}` → tekil/liste aynı shape; `MeasurementCode` (18 değer, büyüyebilir taksonomi) enum yerine permissive `z.string()`. **`productVariantSuppliers` — iki tuzak:** (1) validator dosyası zaten vardı ama **wire edilmemişti** ve iç objeleri `.loose()` değildi → `z.toJSONSchema` `additionalProperties:false` üretiyor, gerçek response ise `variant`/`supplier` relation'ları + `netCost`/`stockQty`/`paymentTermDays` vb. taşıyor → **reddedip 500 üretirdi** (script'le kanıtlandı: strict=INVALID, loose=VALID). (2) `getProductVariantSupplier` repo'da `findUnique` + handler'da null kontrolü yok → kayıt yoksa **200 + `{productVariantSupplier: null}`** → şema `.nullable()` yapıldı. Prisma `Decimal` alanları `normalizeDates` tarafından ISO'ya çevrilmez (Date değil), düz `{s,e,d}` objesine döner → `prismaDecimalSchema` union (frontend'in `decimalLikeToText` tipi bunu doğruluyor). `OwnerApi users`: `updateAssignments` → `UserWithRelations`, loose + permissive `accessStatus`/`groups` string. **Kalan 1/9: ProtectedApi users** — 10 endpoint, `getUser`/`getMe`/`updateMyProfileImage`/`mePermissions` **`apiResponse` (DTO değil)** kullanıyor (colors'daki tarih tuzağı) ve `updateMyProfileImage` iki farklı payload shape'i dönüyor → kendi ünitesi.
- Batch 2 notu (2026-07-09): **AdminApi + PublicApi productAttributeValues**. İkisi de `apiResponseDTO` kullanıyor ✅. **Union şart oldu:** her iki `listProductAttributeValuesHandler` `attributeId` yoksa erken `apiResponseDTO({statusCode:400, payload:{message}})` dönüyor; 200'de `payload:{data}`. Sadece `{data}` kabul eden validator o 400'ü **500'e çevirirdi** → `payload: z.union([{data},{message}])`. `z.toJSONSchema` union'ı `anyOf` üretiyor, AJV'de derlenip iki branch'i de doğruladığı ayrı bir script'le teyit edildi. Shape ayrımı: `createValue/updateValue/deleteValue` **include kullanmıyor** → bare scalar (`pavBaseSchema`); `listValues` `{parentValue, assets}` include ediyor (`pavWithRelationsSchema`). AdminApi list asset'lere `buildAssetUrl` ile `url` ekliyor, PublicApi eklemiyor → `pavAssetSchema` loose. delete payload'ı `{success, value}` (diğerlerinden farklı, ayrı validator). PublicApi'de `validators/productAttributeValues.ts` yoktu, oluşturuldu. `getProductAttributeValue`'ya eksik `idValidator` (request) eklendi; `createProductAttributeValueAssetUpload` presign → validator'sız. **Yakalanan latent bug:** `GET /product-attribute-values` (hem Admin hem Public) route'unda path parametresi YOK, handler ise `attributeId`'yi yalnız `pathParameters`'tan okuyor → bu endpoint **her zaman 400** dönüyor. Davranış korundu (union), ayrıca düzeltme gerekiyor.
- Batch 1 notu (2026-07-09): **AdminApi materials + assets** response validator'ları eklendi. Materials: shape `mapMaterialWithAssets` (`apiResponseDTO` Date→ISO) çıktısından; `materialAssetSchema` (mapAsset: url türetilmiş, FK yok) + `materialSchema` (assets nested), ikisi de `.loose()`; `createMaterialAssetUpload` bilinçli response-validator'sız bırakıldı (presign shape, ayrı — zaten requestValidator'lı). Assets: **Asset modelinde `url` yok**; list/get 5 relation (category/product/variant/pav/material) include ediyor, create/update/delete bare Asset → tek `assetSchema` `.loose()` (zorunlu scalar'lar + nullish FK; include'lar tolere edilir). Doğrulama: tsc temiz; kubi runtime kullanıcıda.
- Pilot notu (2026-07-09): [ProtectedApi/validators/colors.ts](packages/functions/src/ProtectedApi/validators/colors.ts)'e `getColorValidator` (request) + `colorResponseValidator` (tekil `payload:{color}`) + `listColorResponseValidator` (liste `payload:{colors}` — AdminApi'nin `data/meta` paginasyonundan **farklı**, ProtectedApi `listActiveColors` kullanıyor) eklendi; [actions.ts](packages/functions/src/ProtectedApi/functions/colors/actions.ts)'te 4 handler'a wiring yapıldı. Shape `colorRepository`'nin döndürdüğü tam `Color` modelinden türetildi (select yok) — permissive: `hex` düz string (z_hex regex değil), `rgbR/G/B` `nullish` (Int?), `system` enum schema.prisma'dan. **Yakalanan:** AdminApi'nin `colorSchema`'sında `code: z.number()` var ama model+request `String` — Admin tarafında latent tutarsızlık (bu pilotta tekrarlanmadı, doğrusu `z.string()`). Doğrulama: tsc temiz. **Düzeltme (2026-07-09):** ProtectedApi colors dört handler'ı `apiResponse` kullanıyordu — bu tarihleri normalize etmiyor, response validator serileştirmeden önce çalıştığı için `createdAt/updatedAt`'i `Date` görüp "must be string" veriyordu. Dördü de `apiResponseDTO`'ya çevrildi (AdminApi colors'ın zaten kullandığı convention; `normalizeDates` Date→ISO). **Client çıktısı değişmez** (sonraki serializer zaten stringliyordu); yalnız validator artık string görüyor. Ders: response validator eklenen bir handler `apiResponse` (DTO değil) kullanıyorsa tarih alanları patlar → `apiResponseDTO`'ya geçir. Ayrıca ProtectedApi `updateColorHandler` savunmacı kontrolleri (boş body, izinli-alan whitelist, alan doğrulama, Prisma P2025→404/P2002→409 eşlemesi) AdminApi ile hizalandı — `name/isActive` kapsamına uyarlanarak (AdminApi'nin system/code/hex + hex→rgb'si bu endpoint'te yok). Kalan 8 dosya + 2 requestValidator aynı reçeteyle; her handler'ın DTO kullanımı + hata eşlemesi kontrol edilecek.
- Ne: responseValidator'sız 9 `actions.ts` dosyasına validator ekle: AdminApi `assets`, `materials`, `productAttributeValues`, `productMeasurements`; OwnerApi `users`; ProtectedApi `colors`, `users`; PublicApi `productAttributeValues`, `productVariantSuppliers`. requestValidator'sız 2 dosya da aynı işte kapatılmalı.
- Neden: Response shape sözleşmesi tutarsız; frontend bu endpoint'lerde sessiz shape kaymasına açık.
- Etki: **functions** (validator dosyaları + actions) + **frontend** (ilgili `features/**/api` modüllerinin beklediği shape ile validator birebir doğrulanmalı — validator gerçek response'tan dar yazılırsa çalışan endpoint'i kırar; önce mevcut response örnekleri toplanmalı). Dosya başına ayrı PR önerilir.

**P1.3 — Secrets'ı SST Secret'a taşı** · kapsam: orta · **✅ Uygulandı + prod'a deploy edildi (2026-07-23)**
- **🔴 Yan bulgu — secret sızıntısı kapatıldı:** [translate-variant-dictionary-translations.ts](packages/core/prisma/translate-variant-dictionary-translations.ts) `printHelp()` içinde `DIRECT_URL`, `DATABASE_URL` (ikisi de **DB şifresini içeren** bağlantı dizesi) ve `DEEPL_API_KEY` `console.log` ile terminale basılıyordu (argümansız/`--help` çalıştırmada tetiklenir). Codex merge'ünden kalma debug satırları; yalnız bu script'te vardı, diğer iki translate script'inde yok. Silindi + "değeri değil varlığını logla" notu bırakıldı.
- **Kapsam (uygulanan):** `RdsPassword` → [db.ts](infra/db.ts) `password: rdsPassword!.value`, **yalnız prod'da oluşturulur** (Neon secret deseni; kubi/dev set etmek zorunda değil). `GmailSmtpUser` + `GmailSmtpAppPassword` → [ProtectedApi.ts](infra/ProtectedApi.ts)'te tanımlanıp **yalnız davet route'una `link`**'lenir; env bloğundan `GMAIL_*` kaldırıldı; [sendCustomerPortalInvitationEmail.ts](packages/functions/src/shared/mail/sendCustomerPortalInvitationEmail.ts) `getRequiredEnv` → `getRequiredSecret` (`Resource.*.value`). `DeeplApiKey` → db.ts'teki Prisma DevCommand `environment`'ına verilir; **script'ler değişmedi** (hâlâ `process.env.DEEPL_API_KEY` okur) çünkü translate CLI'ları zaten `sst shell --target Prisma` altında çalışıyor ve `deeplTranslator`'ı **hiçbir Lambda kullanmıyor** (yalnız 3 CLI). [config.ts](config.ts)'ten `RDS_PASSWORD`/`GMAIL_*` alanları çıkarıldı.
- **`link` vs `environment` kararı — kodda doğrulandı:** SST v3'te link'lenen secret değerleri düz Lambda environment'ına YAZILMAZ; şifreli `resource.enc` bundle'ında taşınıp runtime'da `SST_KEY` ile çözülür ([function.ts normalizeEnvironment](.sst/platform/src/components/aws/function.ts) yalnız `include.type === "environment"` olanları env'e koyar; `Secret.getSSTLink()` yalnız `properties.value` döner). Env-injection alternatifinde değer Lambda konsolunda görünürdü → `link` bilinçli tercih edildi.
- **`.env`'de KALANLAR (secret değil, silinmez):** `AWS_REGION` (zorunlu — yoksa config.ts exception atar), `HOSTED_ZONE_ID`, `DOMAIN`, `DOMAIN_CERTIFICATE_ARN`, `DEEPL_GLOSSARY_ID`, `DIRECT_RDS_HOST` (**kullanıcı kararı 2026-07-23**: kimlik bilgisi değil, VPC-içi hostname → `DOMAIN` gibi stage config muamelesi görür). Opsiyonel ileri iş: `DIRECT_RDS_HOST` SST'nin Postgres kaynağından türetilebilir mi (elle girmeye gerek kalmaz) — ayrı dilim.
- **Geçici cast kaldırıldı (2026-07-23):** secret'lar set edilip deploy alınınca `sst-env.d.ts` regenerate oldu (`DeeplApiKey`, `GmailSmtpUser`, `GmailSmtpAppPassword` tipleri geldi) ve dosya commit'li → CI de görüyor. Mail helper artık doğrudan `Resource[name].value` kullanır, cast yok.
- Doğrulama: backend tsc ✅ frontend tsc ✅ lint 0 error ✅ core 127 + functions 5 + frontend 16 test ✅ + dokunulan infra dosyalarında tsc hatası yok + kalan `process.env.RDS_PASSWORD|GMAIL_*` referansı yok. README "SST Secrets" bölümü güncellendi.
- **✅ Tamamlandı (2026-07-23):** kullanıcı secret'ları prod+kubi için set etti, `sst diff --stage prod` RDS password değişikliği göstermedi ve main prod'a deploy edildi. Kalan tek temizlik: `.env`'den `RDS_PASSWORD`/`GMAIL_SMTP_USER`/`GMAIL_SMTP_APP_PASSWORD`/`DEEPL_API_KEY` satırlarının silinmesi (kod artık okumuyor).
- Ne: `RDS_PASSWORD`, `GMAIL_SMTP_USER/APP_PASSWORD` → `sst.Secret`; [config.ts](config.ts) tüketicileri güncelle.
- Neden: Secrets şu an `.env` + `process.env` ile taşınıyor; tek makineye bağımlı, rotasyonu izlenemez.
- Etki: **infra** (db.ts, e-posta Lambda'larının env wiring'i) + **functions** (Resource üzerinden okuma) + **README** (kurulum talimatı). RDS şifresi değişimi **prod DB bağlantısını etkiler** — şifreyi değiştirmeden yalnız taşıma yapılmalı, plan gösterip onay alınmalı.

**P1.4 — Kritik yol testleri** · kapsam: büyük (dilimlenebilir) · **✅ Uygulandı (2026-07-10) — 4 dilim TAMAM (core 15→91 test)**
- Dilim 4 notu (2026-07-10): **prisma/errors.ts — 10 yeni test** (core 81→91). `isDatabaseConnectionCapacityError`: P2037 kodu (gerçek `Prisma.PrismaClientKnownRequestError` instance'ı ile), diğer known-request kodları (P2002/P2025) eşleşmez, 4 postgres kapasite mesaj deseni (`it.each`), case-insensitivity, düz string hatalar, message-shaped objeler + **JSON.stringify fallback'i** (message alanı olmayan objenin gövdesinde desen aranır — `{detail: "..."}` yakalanır), null/undefined/number → false. `DATABASE_CONNECTION_CAPACITY_MESSAGE` sabiti de korumaya alındı (503 gövdesine kullanıcıya-görünür sızar; değişiklik bilinçli olmalı). **P1.4'ün plandaki öncelik listesi böylece bitti** (pricing ✅ / policy ✅ / service yetki fonksiyonları ✅ / authMiddleware ✅ / prisma-errors ✅). Bilinçli kapsam dışı kalan: service'in transaction'lı karar akışları (approve/reject/counter bypass'ları) — entegrasyon testi olarak ayrı iş (P2 adayı).
- Dilim 3 notu (2026-07-10): **authMiddleware — 16 yeni test** (core 65→81). Prisma mock'lu (`vi.mock("@/core/db/prisma")` + user.findUnique/create/update `vi.fn`; Prisma generic delegate imzaları mockImplementation ile uyuşmadığından mock referansları düz `vi.fn`'e cast'lenir). Kapsam: (1) **auth kapıları** — claims yok→401 (protected + non-optional), `optional:true`→user'sız geçiş, sub/email eksik→401; (2) **Cognito grup parse** (auto-create üzerinden gözlemlenir — event.user.groups DB'den gelir, parse yalnız create'te kullanılır): `'["admin"]'` bracket formatı, virgül/boşluk ayrımı, array payload, bilinmeyen grup düşürme, grupsuz→`["user"]`+PENDING_REVIEW; (3) **sync + erişim kapıları** — eksiksiz kullanıcıda update yok, eksik ad/soyad backfill'i, `isActive:false`→403, non-ACTIVE→403 / `allowInactive`→geçer; (4) **permission** — direkt grup eşleşmesi, core hiyerarşi (owner→admin, admin→user), alt rol üst gereksinimde 403. **Belgelenen iki gerçek davranış:** (a) hiyerarşi yalnız core roller (owner/admin/user) için işler — `["sales"]`-only route **owner'ı bile reddeder**, route'lar bu yüzden tüm grupları açıkça listelemeli; (b) yeni auto-create edilen PENDING_REVIEW kullanıcı AYNI istekte 403 alır (hesap oluşur ama panele giremez — /hesabim yönlendirmesi frontend'in işi). Ayrıca DB'nin kaynak-of-truth olduğu doğrulandı: claims `admin` dese bile flag'ler DB `groups`'tan türetilir (ARCHITECTURE access-lifecycle kuralı). **Kalan dilim:** `prisma/errors.ts` mapping.
- Dilim 2 notu (2026-07-10): **service.ts yetki fonksiyonları — 18 yeni test** (core 47→65). Kapsam bilinçli olarak service'in **saf** exported fonksiyonlarıyla sınırlı: `getCurrentPendingStep` (pending seçimi/atlama), `canViewBusinessRequest` (owner/admin her zaman; customer/supplier yalnız kendi kaydı; sales_director yalnız SALES domain'i; sales atanmış-satışçı kuralı; purchasing atama listesi kuralı), `assertBusinessRequestViewAccess` (401/403), `canDecideBusinessRequest` (customer yalnız kendi CUSTOMER adımı; SD SALES+SALES_DIRECTOR adımları ama ADMIN değil; sales'te adım ataması + müşteri ataması çifte kapısı; purchasing'de rol+adım+atama listesi üçlü kapısı; domain-dışı red), `assertAllowedCustomerRequestType` (4 portal tipi / 400). Transaction'lı karar akışları (approve/reject/counter + admin/SD bypass) bilinçli kapsam DIŞI — prisma transaction mock'ları kırılgan olur; entegrasyon testi ayrı iş. **İki altyapı düzeltmesi:** (1) [vitest.config.ts](packages/core/vitest.config.ts) oluşturuldu — root tsconfig `paths` alias'ları vitest'te çözülmüyordu; `@/core/...` runtime importu olan HERHANGİ bir modülün testi bu config olmadan yüklenemiyordu (mevcut testler tesadüfen hep relative-import zincirliydi). (2) service.test'te `vi.mock("@/core/db/prisma")` — gerçek prisma.ts modül scope'unda sst `Resource`'a dokunuyor, sst shell'siz test:ci/CI'da import anında patlardı. **Kalan dilimler:** `authMiddleware.ts`, `prisma/errors.ts` mapping.
- Dilim 1 notu (2026-07-10): **pricing + policy — 32 yeni test** (core toplamı 15→47, hepsi ilk çalıştırmada yeşil; `test:ci` sst shell'siz doğrulandı). (1) [productVariantSupplier.test.ts](packages/core/src/core/helpers/pricing/productVariantSupplier.test.ts) (12): `decimalLikeToNumber` (null/NaN/string/Decimal-like `toNumber`) + `resolveProductVariantSupplierPricing` para matematiği — netCost türetme (price×(1+opRate/100)), listPrice türetme (netCost×(1+profit/100)), açık netCost'un türetileni ezmesi, listPrice'tan geriye profitRate hesabı, mevcut (existing) Decimal-like oranlara düşüş, 2-hane yuvarlama (türetmenin HAM price ile yapıldığı belgelendi), `pricingUpdatedAt`'in yalnız alan geldiğinde damgalanması. (2) [customerPaymentSchedule.test.ts](packages/core/src/core/helpers/pricing/customerPaymentSchedule.test.ts) (8): AGENTS.md'nin kanonik `%50 peşin + %50 30 gün` senaryosu, geçersiz adım filtreleri (yüzde 0/>100/NaN, negatif-küsuratlı vade, boş label), non-object atlama, yüzde yuvarlama, `tr-TR` ondalık virgül formatı (`%33,33`), fallback. (3) [policy.test.ts](packages/core/src/core/helpers/businessRequests/policy.test.ts) (12): rol öncelik sırası (OWNER > ADMIN > SALES_DIRECTOR > ...), uygun bayrak yoksa 403, domain eşlemesi (6 SALES + 6 PURCHASING tipi), **onay zincirleri**: customer→sales(atanmış)→sales_director→admin, atanmış satışçı yoksa adım atlanır, sales→SD→admin, SD→admin, supplier→purchasing→admin, purchasing→admin, matris-dışı kombinasyonlar boş döner. **Kalan dilimler:** `service.ts` (deps mock'lu), `authMiddleware.ts` (rol/erişim), `prisma/errors.ts` mapping.
- Ne: Öncelik sırasıyla unit testler: `core/helpers/pricing` (para hesabı), `core/helpers/businessRequests/policy.ts` + `service.ts` (onay yetkisi), `authMiddleware.ts` (rol/erişim), `prisma/errors.ts` mapping.
- Neden: 6 test dosyasıyla; fiyatlama veya onay zincirinde bir regresyonun yakalanma şansı sıfıra yakın.
- Etki: yalnız **core** test dosyaları; ürün davranışı değişmez. P0.1'deki CI'ya bağlanır.

**P1.5 — `next.config` duplikasyonunu ve görsel optimizasyonunu netleştir** · kapsam: küçük · **✅ Deploy edildi + doğrulandı (2026-07-15); prod'da yerel görsel regresyonu çözüldü (aşağı bkz.)**
- `.mjs`/`.ts` ikilisi: Faz 1a'da çözüldü (tek dosya `next.config.ts` kaldı) ✅.
- Görsel optimizasyonu (2026-07-14): **Ölçüm** — canlı (`ceyhunlarplastik.xyz`) public API'den 8 gerçek ürün PRIMARY görseli çekildi; orijinaller **800×1000 px, 31–160 KB** (upload'ta zaten küçültülüyor, dev boyut yok). `sharp` (Next optimizer'ının birebir kütüphanesi) ile ölçülen kazanç: ürün hero 640px WebP → **%95**, katalog grid 256px WebP → **%98** (grid sayfası ~1.9 MB → ~35–70 KB). Maliyet ihmal edilebilir: optimizasyon görsel×boyut başına ömürde 1 kez, sonrası CloudFront cache. **Kök neden bulundu** (kullanıcının eski "prod'da resim gözükmedi" deneyimi): `remotePatterns` yalnız `*.s3.amazonaws.com` içeriyordu; prod görselleri `cdn.{DOMAIN}`'den gelir → optimizasyon açıkken host allowlist'te olmayınca `/_next/image` **400** → kırık resim; `unoptimized:true` allowlist'i baypas ettiği için maskeliyordu. **Config değişikliği** [next.config.ts](packages/frontend/next.config.ts): `unoptimized` kaldırıldı; `remotePatterns` build-zamanı `process.env.DOMAIN`'den türetiliyor (`*.s3.amazonaws.com` + `*.{DOMAIN}`) → `.xyz`→`.com.tr` migration-safe; `minimumCacheTTL` 1 yıl (UUID URL'ler değişmez); `deviceSizes`'tan 4K çıkarıldı. `sizes` prop'ları LCP-kritik iki bileşende (ProductCard `20vw`, ProductHero `50vw`) zaten doğru → dokunulmadı (MassProduction/About/Hr hero'larına `sizes` eklemek ayrı, isteğe bağlı marjinal kazanç). **`.env` DOMAIN placeholder'ı ("DOMAIN") kubi değeri, bug değil** — kubi görselleri s3'ten gelir (pattern kapsar); prod/dev deploy'da gerçek DOMAIN process env'de (router.ts de onu kullanıyor) → `*.{gerçekdomain}` doğru çözülür. frontend tsc ✅. **kubi doğrulandı (2026-07-14):** `/_next/image?url=...s3.amazonaws.com...&w=640&q=75` → **200 OK**, resim görünüyor — pipeline + s3 allowlist + küçültme çalışıyor. **Kalan (kullanıcı deploy'u erteledi):** dev/prod'da `cdn.{domain}` pattern'i ve özel Router `/_next/image` yönlendirmesi (kubi bunu kanıtlayamaz — placeholder domain + default router; dev de appRouter kullandığından prod ikizi). Önerilen sıra: dev → prod. Rollback: `unoptimized:true` geri + redeploy (tek satır). **Deploy edilene kadar prod davranışı değişmez.**
- **Deploy sonrası regresyon + çözüm (2026-07-15):** Prod deploy'da uzak CDN görselleri sorunsuz optimize oldu ama **yerel `public/` görselleri** (`/hakkimizda.jpg`, `/logos/*`, `/motto.png` — ~22 dosya) `/_next/image`'te **500** döndü. CloudWatch (optimizer Lambda `ceyhunlarw-prod-CeyhunlarFrontendImageOptimizerFunction`): `⨯ upstream image response failed … TypeError: a is not a function`. **Kök neden: Next.js 16.2.6 regresyonu** — internal `fetchInternalImage` imzasına `maximumResponseBody` parametresi eklendi (16.2.4: `(href,_req,_res,handleRequest)` → 16.2.6: `(href,_req,_res,maximumResponseBody,handleRequest)`); SST 3.19.3'ün bundle'ladığı OpenNext hâlâ 4-arg formda çağırıyor → handler yanlış slota düşüyor. Yalnız yerel görseller etkileniyor (`fetchInternalImage`); uzak görseller `fetchExternalImage` yolunu kullandığından sağlam. P1.5 hatayı yaratmadı, optimizasyonu açtığı için görünür yaptı. 16.2.10 = `latest` stable, ileriye dönük stable fix yok (yalnız 16.2.4/16.2.5 temiz), OpenNext 4.0.3 de karşılamıyor. **Uygulanan fix:** [packages/frontend/package.json](packages/frontend/package.json) `next: "16.2.4"` (exact) + kök [package.json](package.json) `overrides: { next: "16.2.4" }`; lockfile yalnız 10 next-family girdide cerrahi 16.2.10→16.2.4 (transitive dep bump edilmedi — full clean install 528 girdi churn'üne yol açtığı için kaçınıldı). Tek sürüm 16.2.4, typecheck ✅, deploy sonrası prod'da yerel görseller **200 OK**. **Upstream (SST/OpenNext) yeni imzayı karşılayınca geri al:** override'ı kaldır + `next`'i `^16.2.x`'e döndür.
- Etki: **frontend** config + deploy'da **infra** (SST image-optimizer Lambda'sını otomatik ekler — yeni/izole kaynak, mevcut korumalı kaynaklara dokunmaz; CLAUDE.md gereği prod deploy öncesi plan sunuldu/onaylandı).

**P1.6 — Structured logging + correlation id (Lambda Powertools)** · kapsam: orta · **✅ Uygulandı (2026-07-09) — 4 boundary + temizlik**
- Rollout notu (2026-07-09): pilot kubi'de doğrulandıktan sonra aynı blok üç boundary'ye yayıldı — [ProtectedApi.ts](infra/ProtectedApi.ts) (`ceyhunlar-protected-api`), [AdminApi.ts](infra/AdminApi.ts) (`ceyhunlar-admin-api`), [OwnerApi.ts](infra/OwnerApi.ts) (`ceyhunlar-owner-api`); her biri `POWERTOOLS_SERVICE_NAME` (boundary'ye özel, CloudWatch'ta ayrı filtrelenir) + `POWERTOOLS_LOG_LEVEL` (prod=INFO) + `logging:{retention:"1 month"}`. Owner'da `environment` bloğu yoktu → eklendi. Türetilmiş option objeleri (`portalCustomerInviteRouteOptions`, `businessWorkflowRouteOptions` vb.) `...defaultRouteOptions` yaydığı için env+logging'i miras alıyor. **Temizlik:** fiilen ölü `@middy/error-logger` [middy.ts](packages/core/src/core/middy.ts)'ten ve `packages/core/package.json`'dan kaldırıldı (httpErrorHandler `onError`'ı önce çalışıp yanıtı set ettiğinden hiç tetiklenmiyordu). Doğrulama: dokunulan dosyalarda tsc hatası yok. **✅ prod'a deploy edildi (2026-07-23).**
- Pilot uygulama notları: `@aws-lambda-powertools/logger@2.33.1` core'a eklendi. Merkezi singleton [logger.ts](packages/core/src/core/logger.ts) (plan `observability/logger.ts` diyordu → `core/logger.ts` olarak kondu, daha yalın). [middy.ts](packages/core/src/core/middy.ts): `injectLambdaContext(logger, { logEvent:false, resetKeys:true })` (plan `clearState` diyordu → v2'de doğru ad **`resetKeys`**) + correlationId middleware'i. **`correlationIdPath` KULLANILMADI**: Powertools'un `correlationId` alt-modülü `@aws-lambda-powertools/jmespath` gerektiriyor; gereksiz bağımlılık yerine `event.requestContext.requestId` manuel `logger.appendKeys({ correlationId })` ile iliştirildi. [httpErrorHandlerMiddleware.ts](packages/core/src/core/middleware/httpErrorHandlerMiddleware.ts): ham `console.error` dump'ları → yapısal `logger.error/warn`. Infra pilot [PublicApi.ts](infra/PublicApi.ts) `defaultOptions`: `POWERTOOLS_SERVICE_NAME` + `POWERTOOLS_LOG_LEVEL` (prod=INFO/diğer=DEBUG) + açık `logging:{retention:"1 month"}` (=SST varsayılanı 30gün, davranış değişmez). **Bulgu:** SST Ion retention'ı zaten "1 month" default'luyor (`.sst/platform/.../logging.ts`), "forever" override'ı yoktu → sessiz depolama büyümesi riski bu projede yoktu. Kubi'de lokal doğrulandı: 404 hata yolunda terminalde `level/service/correlationId/cold_start/function_name` içeren tek-satır JSON. **sst dev Live modda loglar CloudWatch'a değil lokal terminale gider.**
- Pilot uygulama notları: `@aws-lambda-powertools/logger@2.33.1` core'a eklendi. Merkezi singleton [logger.ts](packages/core/src/core/logger.ts) (plan `observability/logger.ts` diyordu → `core/logger.ts` olarak kondu, daha yalın). [middy.ts](packages/core/src/core/middy.ts): `injectLambdaContext(logger, { logEvent:false, resetKeys:true })` (plan `clearState` diyordu → v2'de doğru ad **`resetKeys`**) + correlationId middleware'i. **`correlationIdPath` KULLANILMADI**: Powertools'un `correlationId` alt-modülü `@aws-lambda-powertools/jmespath` gerektiriyor; gereksiz bağımlılık yerine `event.requestContext.requestId` manuel `logger.appendKeys({ correlationId })` ile iliştirildi. [httpErrorHandlerMiddleware.ts](packages/core/src/core/middleware/httpErrorHandlerMiddleware.ts): ham `console.error` dump'ları → yapısal `logger.error/warn`. Infra pilot [PublicApi.ts](infra/PublicApi.ts) `defaultOptions`: `POWERTOOLS_SERVICE_NAME` + `POWERTOOLS_LOG_LEVEL` (prod=INFO/diğer=DEBUG) + açık `logging:{retention:"1 month"}` (=SST varsayılanı 30gün, davranış değişmez). **Bulgu:** SST Ion retention'ı zaten "1 month" default'luyor (`.sst/platform/.../logging.ts`), "forever" override'ı yoktu → sessiz depolama büyümesi riski bu projede yoktu. Kubi'de lokal doğrulandı: 404 hata yolunda terminalde `level/service/correlationId/cold_start/function_name` içeren tek-satır JSON. **sst dev Live modda loglar CloudWatch'a değil lokal terminale gider.** Kalan: uygun görülürse aynı env bloğunu Protected/Admin/Owner `defaultOptions`'larına yay (ayrı adım). Not: `@middy/error-logger` fiilen ölü (httpErrorHandler `onError`'ı önce çalışıp yanıtı set ediyor) — ileride temizlenebilir.
- Ne: `@aws-lambda-powertools/logger` ile merkezi logger (`packages/core/src/core/observability/logger.ts`) + [middy.ts](packages/core/src/core/middy.ts) zincirine `injectLambdaContext` (`logEvent: false`, `clearState: true`) ve her isteğe korelasyon alanları ekleyen custom middleware: `requestId`, `routeKey`, `method`, `path`, `userSub`, `userGroups`, `statusCode`, `durationMs`, ilgili entity id/code. Tek noktadan eklendiği için 197 handler'ın tamamı otomatik kazanır. Referans: [Powertools Logger](https://docs.aws.amazon.com/powertools/typescript/latest/core/logger/).
- Neden: Şu an yalnız `errorLogger` var; genel hata mesajlarının arkasındaki gerçek sebep CloudWatch'ta izlenemiyor. `inputOutputLogger` tam da boyut/gürültü nedeniyle kapatılmıştı ([middy.ts:134](packages/core/src/core/middy.ts)) — Powertools `logEvent: false` ile aynı sorunu yaşatmadan yapısal log üretir.
- Etki: **core** (middy.ts + yeni `observability/` modülü + `package.json`) + **functions** (davranış değişmez, log formatı değişir — CloudWatch'ta mevcut log filtresi/alışkanlık varsa güncellenmeli). Kurulum notu: repo **npm workspaces** kullanıyor (pnpm değil) → `npm install @aws-lambda-powertools/logger -w @ceyhunlarweb/core`.
- Dikkat edilecekler:
  - `serviceName` sabit yazılmamalı; boundary bazında (`admin-api`, `public-api`, `protected-api`, `owner-api`, workflow) env'den verilmeli ki CloudWatch'ta API sınırına göre filtrelenebilsin.
  - `userSub`/`userGroups` loglanabilir; e-posta gibi PII taşıyan claim'ler loglanmamalı.
  - `appendKeys` çağrısı auth middleware **sonrasında** da zenginleştirilebilir (`event.user.id` DB id'si claim'lerden daha değerlidir); `clearState: true` invocation'lar arası sızıntıyı önler — Lambda execution reuse nedeniyle zorunlu.
  - `onError` log adımının mevcut `httpErrorHandlerMiddleware` ile sıralaması doğrulanmalı (middy `onError`'ları ters sırada çalıştırır); hata yutulmadan önce loglandığı bir smoke testle kanıtlanmalı.
- **Tracer + Metrics bilinçli olarak bu maddeye dahil değil**: `@aws-lambda-powertools/tracer` X-Ray active tracing gerektirir → tüm Lambda'larda infra değişikliği demektir (prod korumalı — CLAUDE.md gereği ayrı plan + onay); `metrics` EMF ile CloudWatch ingest maliyeti ekler. İkisi de Logger'dan fayda görüldükten sonra ayrı bir P2 kararı olarak değerlendirilmelidir.

**P1.7 — CI kapsamını genişlet: backend typecheck + lint temizliği + audit'i bloklayıcı yap** · kapsam: orta · **✅ Uygulandı (2026-07-10)**
- Uygulama notları (2026-07-10): **(a) Backend typecheck bloklayıcı** — [tsconfig.backend.json](tsconfig.backend.json): core+functions src'yi `.sst`'siz denetler (`sst-env.d.ts` Resource tiplerini sağlar; `skipLibCheck` node_modules .d.ts gürültüsünü keser — @middy'nin opsiyonel `@aws/durable-execution-sdk-js` referansı vb.); root'a `typecheck:backend` script'i. İzole koşum root çalıştırmada gizli kalan **gerçek hataları çıkardı ve düzeltildi**: `supplierPayloads.buildApprovedVariantPricingUpdate` imzası `unknown`→`DecimalLike` (artık export), 2 eski test dosyasında `.ts`-uzantılı import + interface'e sonradan eklenen `getDeleteBlockers`'ın eksik mock'u. Prisma-7-kırığı tek-seferlik `fillCategorySlugs/fillProductSlugs` script'leri exclude edildi (silme kararı ayrı temizlik). **(b) Lint bloklayıcı** — asıl keşif: "1218 hata"nın gerçek kaynağı eslint'in **`.open-next/**` build çıktısını taraması**ydı (36k+ satır, 895 dosya); ignore eklenince gerçek borç 77 error + 48 warning'e indi. Trivial fix: template kalıntısı `protected/page.tsx` `<a>`→`<Link>`. Kalan borç 3 kuralda başta **warn'a indirilmişti**; sonra hook kuralları temizlenip error'a çekildi (aşağı bak). Sonuç: 0 error, lint job'u bloklayıcı.
- Lint hook-borcu temizliği (2026-07-10): `react-hooks/set-state-in-effect` + `react-hooks/refs` **tekrar error** yapıldı (7 uyarı sıfırlandı). İki kategori: (1) **Gerçek çözüm** — mount-gate hydration deseni (`useState(false)`+`useEffect(setMounted)`) yeni [lib/hooks/useHydrated.ts](packages/frontend/lib/hooks/useHydrated.ts) (`useSyncExternalStore`, server=false/client=true — birebir aynı davranış) ile değiştirildi: `BaseFormDialog`, `InquiryCartNavItem`. (2) **Gerekçeli satır-disable** — meşru effect-sürüşlü sync'ler (auth-korumalı/harita kodu, riskli refactor yerine): `ProductAssistantModal` (step-2 grup auto-select), `CustomerLocationPickerMap` (dış koordinat prop'uyla recenter), `CustomerMapPageClient` (kaybolan activePoint temizliği), `CustomerPortalAddressCarousel` (index clamp), `ProductIndustrialUsageEditor` (latest-ref deseni). Doğrulama: lint 0 error / 115 warning + frontend tsc + 13 test. Kalan warn: yalnız `no-explicit-any` (~66, ayrı iş). **(c) Audit iki katmanlı** — `--audit-level=critical` **bloklayıcı** (lokalde geçiyor; yeni critical'ler CI'ı kırar), `high` advisory kalıyor (4 high = sst CLI zinciri, P2.6'ya bağlı — plandaki öngörü). CI'ın 6 bloklayıcı adımı lokalde uçtan uca simüle edildi: backend tsc ✅ frontend tsc ✅ core 91 ✅ frontend 13 ✅ lint 0 error ✅ audit critical ✅.
- Ne: (a) Backend typecheck: root [tsconfig.json](tsconfig.json) `include`'u tüm repoyu (`packages/**/*`, `infra/**/*`, `sst.config.ts`) kapsıyor; core/functions bunu miras aldığı için izole `tsc --noEmit` koşulamıyor — `.sst/platform`'un kendi `@types/node` kopyası 12k+ hata kaskadı üretiyor. Paket bazında `include` + `skipLibCheck` stratejisiyle tsconfig'ler ayrıştırılmalı. (b) Frontend lint'teki 1218 hata dilim dilim temizlenip lint job'u bloklayıcı yapılmalı. (c) Audit job'u bloklayıcı yapılmalı — ancak P0.3 sonrası kalan 4 high tamamen `sst` CLI zincirinde olduğundan bu, P2.6 (SST 4) çözülmeden veya audit sst zincirini dışlayacak şekilde scope edilmeden mümkün değil.
- Neden: CI şu an yalnız frontend tipi ve 28 unit testi koruyor; backend'de tip regresyonu yakalanmıyor.
- Etki: root + paket `tsconfig.json`'ları (editör ve `sst dev` deneyimi etkilenebilir — dikkatli, tek tek doğrulanarak) + `.github/workflows/ci.yml` + frontend lint düzeltmeleri.

**P1.8 — Lambda 6MB payload sınıfının kalanları** · kapsam: orta · *(2026-07-11 prod 502 kök neden çalışmasının devamı)*
- Bağlam: `/urun/[slug]` prod 502'lerinin kök nedeni çözüldü (industrialUsages slim include+mapper, public listProducts card view, SimilarProductsRow DTO, public variant-table güvenli DTO, OpenNext `aws-lambda-streaming`). Aynı sınıftan kalan riskler:
- (a) **Admin ürün listesi hâlâ full include** — ✅ **Uygulandı (2026-07-15):** [listProductsHandler.ts](packages/functions/src/AdminApi/functions/products/handlers/listProductsHandler.ts) artık `listProducts(query, { view: "card" })` çağırıyor → repository'nin mevcut `listCardInclude`'u ağır `industrialUsages` derin zincirini listeden düşürür (`category`/`assets`/`attributeValues` kalır; bu include public listeyle paylaşıldığı için DEĞİŞTİRİLMEDİ). Mapper `industrialUsages: []` üretir; list response validator'da `industrialUsages` optional + `.loose()` → runtime güvenli. **Edit dialog artık tam ürünü açılışta fetch ediyor:** yeni [useProduct.ts](packages/frontend/features/admin/products/hooks/useProduct.ts) hook'u (React Query, mevcut `getProduct` api → `GET /products/{id}` full detay); [EditProductDialog.tsx](packages/frontend/features/admin/products/components/EditProductDialog.tsx) shell (fetch + loading/error state) + iç `EditProductForm` (tam veriyle mount-anı defaultValues — effect-reset yok). Admin liste tablosu (`ProductsTable`/`Filters`) zaten `industrialUsages`/`attributeValues` okumuyordu. Doğrulama: backend+frontend tsc + lint 0 error. **✅ prod'a deploy edildi (2026-07-23).**
- (b) **Portal fiyat verisi public endpoint'te** — ✅ **Çözüldü (B0 3a+3b, 2026-07-14)**: public yanıttan `variantSuppliers` tamamen çıkarıldı; müşteri fiyatı yeni ProtectedApi endpoint'ine taşındı. Detay aşağıda B0 notunda.
- (c) **`RequestEntityTooLarge` alarmı yok** — ✅ **Uygulandı (2026-07-17):** İki parça. **(1) observability modülü aktive edildi:** [sst.config.ts:21](sst.config.ts) `await import("./infra/observability")` yorumdan çıkarıldı → modülün tamamı (P0.5 SNS topic + email aboneliği + concurrency/throttle/p95-duration alarmları, hepsi `isProd` gated) bir sonraki `deploy --stage prod`'da canlıya gelir. **(2) 6MB response-payload alarmı:** [observability.ts](infra/observability.ts)'e `LogMetricFilter` + `MetricAlarm` döngüsü eklendi — Lambda senkron yanıtı 6MB'ı aşınca yazdığı `"Response payload size exceeded maximum allowed payload size"` log satırını custom metriğe (`Ceyhunlarweb/Prod`) çevirir, ≥1 olayda mevcut SNS topic'e bildirir. **Hedef: yalnız BUFFERED API Gateway Lambda'ları** — 3 public ürün route'u (listProducts/getProductBySlug/getProductVariantTable) + admin ürün listesi ([AdminApi.ts](infra/AdminApi.ts)'te `adminListProductsRoute` export edildi). **Frontend server bilinçli HARİÇ** — `aws-lambda-streaming` (open-next.config.ts) kullandığı için 6MB senkron-response limitine tabi değil. Log group'a `route.nodes.function.nodes.logGroup` üzerinden doğrudan referans (create-ordering race'i yok; fallback `$interpolate`/aws/lambda/{name}). Doğrulama: root `tsc`'de dokunulan 3 dosyada (observability/AdminApi/sst.config) tek hata yok (platform @types/node kaskadı hariç). **✅ prod'a deploy edildi (2026-07-23)** → SNS topic + alarmlar canlıda. ⚠️ **Açık aksiyon (kullanıcı):** SNS email aboneliği, `kubilayuysal.ceyhunlarplastik@gmail.com` adresine gelen AWS onay linkine tıklanana kadar **Pending** kalır ve alarm tetiklense bile bildirim GÖNDERMEZ. Onaylandığı teyit edilene kadar bu izleme fiilen sessizdir.
- (d) **Variant-table in-memory dedupe** — [getProductVariantTableHandler.ts](packages/functions/src/PublicApi/functions/products/handlers/getProductVariantTableHandler.ts) tüm varyantları çekip bellekte dedupe/sort/paginate ediyor; binlerce varyantta memory/duration riski (şu an latent — prod'da varyant verisi yok).
- (e) **Sessiz truncation** — ✅ **Uygulandı (2026-07-14)**: [getProductVariantTableHandler.ts](packages/functions/src/PublicApi/functions/products/handlers/getProductVariantTableHandler.ts) `normalizeListQuery` çağrısına `maxLimit: 500` eklendi (paylaşılan default 100 değişmedi → başka endpoint etkilenmez). Frontend hem public katalog hem müşteri portalı bu endpoint'i `limit=500` ile, client-side sayfalama olmadan çağırıyor; default clamp 100+ varyantlı üründe tabloyu sessizce kesiyordu. Payload güvenli DTO (`mapPublicProductVariantTableRow`) olduğu için 500 payload-safe. Doğrulama: backend tsc temiz. AdminApi varyant-tablo handler'ı ayrı kod yolu (`normalizeListQuery` kullanmıyor) → kapsam dışı. **Kalan:** >500 varyant için gerçek çözüm sayfalama UI'ı, (d) ile birlikte.
- (f) **`unstable_cache` "sonsuz stale" / sessiz hata** — ✅ **Uygulandı (2026-07-14, #2)**: [getProductVariantTable.ts](packages/frontend/features/public/products/server/getProductVariantTable.ts) `catch → []` hatayı "varyant yok"tan ayırt edilemez kılıyordu (kullanıcı yanıltıcı "ölçü bulunamadı" görüyordu). Return `VariantTableData[]` → `{ variants, error }` discriminated result'a çevrildi (resilience için `[]` fallback korunur ama `error:true` işareti taşınır). `ProductVariantTable`'a `loadError?` prop'u + boş dalında hata state'i (`table.loadError` katalog anahtarı, tr/en) — boş liste artık "yüklenemedi" olarak gösterilir. 4 sayfa çağıranı `.variants`'a güncellendi (varyant-detay sayfaları ölçü-bazlı empty'yi koruyor). Not: `unstable_cache` hatayı zaten cache'lemiyor (catch cache dışında); sıcak cache'te revalidation hatası Next SWR ile son iyi değeri servis eder → `error` bayrağı yalnız SOĞUK cache hatasında true. **Error-handling kontratı #3'ün shape değişikliğinden bağımsız (ayrı eksen) → #3 bunu korur.** Doğrulama: frontend tsc + parity 750 + lint 0 error.
- **Variant-table derin analiz + yeniden önceliklendirme (2026-07-14):** Kullanıcı domain kurallarını netleştirdi → 3 kitle, 3 hassasiyet: **public** ölçü→renk/hammadde/kod (fiyat/tedarikçi YOK), **customer** + liste fiyatı (min listPrice), **admin/sales** tam tedarikçi+variantSuppliers ama **yalnız tıklanan ölçü için, anlık fetch**. Backend: indeksler zaten optimal (`@@unique([productId,supplierCode,versionCode,variantIndex])` WHERE+ORDER BY'ı birebir karşılıyor; ilişki FK indeksleri mevcut; Prisma include N+1 yapmaz) → sorgu yavaşlığı yok. **B1 ✅ Uygulandı (2026-07-14):** [repository.ts](packages/core/src/core/helpers/prisma/productVariants/repository.ts) `getProductVariantTableData`'da `variantSuppliers` `include→select` (yalnız id/isActive/currency/listPrice/pricingUpdatedAt/updatedAt + supplier{id,name}) → cost alanları (`price`/`netCost`/`profitRate`/...) + supplier'ın 12 fazladan alanı DB'den Lambda'ya HİÇ çekilmiyor (defense-in-depth + transfer↓); DTO çıktısı birebir aynı, tek çağıran public handler (admin `listProductVariants` ayrı metod). B3 (root orderBy) bilinçli bırakıldı — dedup "ilk kazanır" determinizmini besliyor. **B0 (yeni, coupled — #3 mini-planı bekliyor):** public'i fiyat/tedarikçisiz shape'e daralt + customer fiyatını ProtectedApi overlay'e taşı (P1.8(b)'yi kapsar; public+customer AYNI değişiklikte, çünkü ikisi de bugün aynı endpoint'i kullanıyor). **B0-admin:** ProtectedApi `getVariantSuppliersForMeasurement` + tıkla-getir. Frontend: çift cache (ISR+React.cache+unstable_cache) origin'i koruyor; **F1** 500-satır DTO RSC prop olarak client'a gidip client'ta grupleniyor → gruplamayı server'a taşımak HTML↓ (varyant verisi büyüyünce). **B2/(d)** additive fingerprint kolonu **veri kaybettirmez** (ALTER ADD COLUMN, backfill; ölçüler güvende) ama migration onaylı + latent. Sıra: #1(B1)✅ → #2(f)✅ → #3(B0 3a+3b)✅ → #4(B0-admin) ✅ **mevcut altyapıyla karşılandı, yeni kod yok** → #5(F1.2)✅ → #6(F1.1 opsiyonel)/(B2 latent).
- **B0 3a+3b ✅ Uygulandı (2026-07-14) — variant-table veri sınırı:** Public endpoint'ten fiyat/tedarikçi **tamamen** çıkarıldı; müşteri fiyatı ayrı ProtectedApi endpoint'ine taşındı (public sızıntısı kapandı = P1.8(b) çözümü). **Backend:** dedup/sort/paginate mantığı paylaşılan [dedupeVariantTable.ts](packages/core/src/core/helpers/products/dedupeVariantTable.ts)'e çıkarıldı (public+customer handler ortak); repository `getProductVariantTableData(productId, {includeListPrice?})` — public'te variantSuppliers HİÇ çekilmez, customer'da yalnız `{listPrice, currency, pricingUpdatedAt, updatedAt}` (cost + tedarikçi kimliği YOK); iki DTO ([mapPublicProductVariantTableRow](packages/core/src/core/helpers/products/mapPublicProductVariantTableRow.ts) = fiyatsız yapı, `mapCustomerProductVariantTableRow` = +listPrice); yeni ProtectedApi route `GET /portal/customer/products/{id}/variant-table` (auth: customer/sales/sales_director/admin/owner), handler public'le aynı dedup helper'ı kullanır. Public handler `sortMeasurements` dead-helper temizlendi. **Frontend:** yeni `protectedServerClient()` (serverClient.ts); yeni [getCustomerProductVariantTable.ts](packages/frontend/features/customerPortal/server/getCustomerProductVariantTable.ts) (authenticated, `{variants,error}` kontratı, `unstable_cache` yok — panel dinamik); müşteri VARYANTLAR sayfası bu fn'e geçti (`CustomerPortalVariantDetailsTable` DEĞİŞMEDİ — hâlâ `variantSuppliers[].listPrice` okuyor); paylaşılan `ProductVariantTable`'a `hasSupplierData` gate'i (veri yoksa Tedarikçi sütunu/rozeti gizli → public + customer-main). **Semantik korundu:** ham min tedarikçi listPrice (resolveMinListPrice); customer'a-özel resolveCustomerVariantPrice bu dilime dahil değil. **#4 (B0-admin) ✅ Kapatıldı (2026-07-15) — mevcut altyapıyla karşılandı, YENİ KOD YOK:** Kod taraması gösterdi ki admin/sales için tam tedarikçi+maliyet yüzeyi zaten mevcut ve doğru-scope'lu: **sales** `/satis/urunler` → `SupplierVariantPricesPageClient mode="sales"` → `GET /sales/variant-prices`; **purchasing** `GET /purchasing/variant-prices`; her ikisi de tek handler `listSupplierVariantPrices` (auth `["supplier","purchasing","sales","sales_director","admin","owner"]`, response-validated, sayfalı, `productId`/`variantId`/`categoryId` filtreli, tam pricing: price/netCost/profitRate/operationalCostRate/listPrice). **admin/owner** `/admin/products/{id}/variants` → `ProductVariantsManager` (tam CRUD). Yeni bir `getVariantSuppliersForMeasurement` endpoint'i bunları birebir tekrar ederdi (AGENTS.md "Reuse before adding") → yazılmadı. Paylaşılan public/customer `ProductVariantTable`'dan tedarikçinin çıkarılması (B0 3a+3b) tüm kitleler için doğru ve yeterli; admin/sales tedarikçiyi kendi adanmış yüzeylerinde görür. **Tek küçük UX boşluğu (opsiyonel, ertelendi):** ortak tabloda giriş yapmış sales için owner/admin'deki "Admin'de aç" benzeri `/satis/urunler` çapraz-linki yok. **B0 3a+3b doğrulama: backend+frontend tsc + next build (kubi) + lint 0 error. ✅ prod'a deploy edildi (2026-07-23).**

- **#5 (F1.2) ✅ Uygulandı (2026-07-15) — gruplamayı client'tan RSC server katmanına taşı, YALNIZ FRONTEND (backend/DB'ye dokunulmadı):** Paylaşılan `ProductVariantTable` (client island) eskiden `variants` olarak ~500 ham satırın tamamını prop alıyordu → Next tüm satırları RSC flight payload'una serialize edip **tarayıcıya** indiriyordu, gruplama client `useMemo`'sundaydı. Artık gruplama saf server helper'a taşındı: yeni [groupVariantMeasurements.ts](packages/frontend/features/public/products/utils/groupVariantMeasurements.ts) (`useMemo` mantığı birebir; dedup "ilk kazanır", min fiyat, sıralama korundu) + [decimalLike.ts](packages/frontend/features/public/products/utils/decimalLike.ts) (Decimal-benzeri parse, component'ten çıkarıldı). `ProductVariantTable` prop kontratı `variants: VariantTableData[]` → `options: GroupedMeasurementOption[]` (önceden gruplanmış); kendi `options` useMemo'su + iki decimalLike fn silindi (`measurementColumns` useMemo kaldı). İki ana sayfa (public `urun/[slug]`, müşteri `musteri/tum-urunler/urun/[slug]`) RSC'de `groupVariantMeasurements(variantTable.variants)` çağırıp gruplanmış option'ları geçer → **tarayıcıya inen payload ~500 satır yerine grup sayısı kadar.** `VariantTableData` tipi component'ten export edilmeye devam (10 dosya import ediyor); varyant-detay tabloları (ham satır tüketen `ProductVariantDetailsTable`/`CustomerPortalVariantDetailsTable`) DEĞİŞMEDİ. Payload derdi kaynağında çözüldü — DB-side gruplama BİLİNÇLİ tercih edilmedi (sorgu zaten hızlı+cache'li; DB'de `string_agg` DB CPU'sunu artırırdı; temiz DB gruplaması ancak materialize `measurementFingerprint` kolonu = B2 migration'ı ile mümkün, latent). Doğrulama: frontend tsc ✅ + lint 0 error. **kubi build + runtime doğrulaması kullanıcıda** (AWS creds bu oturumda yok). **F1.1** (detay endpoint'ine server-side `measurementKey` filtresi) opsiyonel, yapılmadı.

### P2 — İyileştirme

**P2.1 — Bundle diyeti** · kapsam: orta · **✅ Uygulandı (2026-07-14)**
- Uygulama notları (2026-07-14): Üç ağır bağımlılığın **ikisi zaten lazy'ydi** (önceki işlerde çözülmüş): `PdfPreview` (pdfjs) `MaterialCertificateCard` + `CatalogCard`'da `next/dynamic` `{ssr:false}` ile; harita bileşenleri (`ManagedCustomerMap`→Client, `CustomerLocationPicker`→PickerMap) yine `next/dynamic` `{ssr:false}` ile; global `maplibre-gl.css` layout'tan harita bileşenlerine taşınmış (P1.1 Faz 1a'da). **Kalan tek iş mqtt'ydi:** [useRealtimeNotifications.ts](packages/frontend/features/notifications/hooks/useRealtimeNotifications.ts) modül tepesinde `import mqtt from "mqtt"` yapıyordu → `NotificationBell`'i içeren HER panel route'u mqtt'yi baştan yüklüyordu. Hook olduğu için `next/dynamic` uymaz; çözüm: type-only `import type { MqttClient }` (bundle'a girmez) + effect içinde `await import("mqtt")` (yalnız gerçekten bağlanılacağı an). Unmount yarışına karşı `cancelled` flag + `connection` referansıyla korundu; `createConnection` artık `mqtt.connect`'i parametre alıyor. Sonuç (build ile doğrulandı): mqtt tek, ayrı **352 KB lazy chunk**'a çıktı → panel ilk yükleme bundle'ından düştü, ihtiyaç anına ertelendi. Doğrulama: frontend tsc + lint + `next build` (kubi) "Compiled successfully" + chunk analizi. Davranış değişmez (bağlantı yine enabled+authenticated'da kurulur, ilk seferde chunk fetch'i kadar ~ms gecikme). Not: genel "use client azaltma" refactor'u kapsam dışı (sayfa bazında, ölçerek).

**P2.2 — next-auth v4 → Auth.js v5 kararı** · kapsam: büyük, riskli
- Ne: v5 migration'ı ayrı bir proje olarak planla; o zamana dek v4 + `overrides` ile yaşa (P0.3).
- Neden: v4 bakım modunda ve eski bağımlılık çekiyor; ama custom Cognito credentials + refresh akışı ([lib/auth/auth.ts](packages/frontend/lib/auth/auth.ts)) migration'da en kırılgan parça. Acele edilmemeli.
- Etki: **frontend** (session akışı) + dolaylı olarak tüm panel yüzeyleri. "Yavaş ama güvenli" kategorisinin en net örneği.

**P2.3 — X-Ray tracing + custom metrics (Powertools Tracer/Metrics)** · kapsam: orta, infra onaylı
- Ne: P1.6'daki Logger yerleştikten sonra `@aws-lambda-powertools/tracer` (X-Ray) ve `@aws-lambda-powertools/metrics` (EMF) eklenmesi.
- Neden: Logger "ne oldu"yu, tracer "nerede yavaşladı"yı (Prisma sorgusu mu, Cognito çağrısı mı, cold start mı) gösterir; metrics iş-seviyesi sayaçlar (ör. onay/red oranı) sağlar.
- Etki: **infra** (tüm Lambda'larda X-Ray active tracing açılması — prod korumalı, plan + onay şart; CloudWatch/X-Ray maliyeti değerlendirilmeli) + **core** (middy zinciri) + **functions**.

**P2.4 — RDS dayanıklılığı** · kapsam: küçük kod, maliyet kararı
- Ne: `multiAz: false` ve 20 GB storage TODO'ları ([infra/db.ts](infra/db.ts)) için bilinçli karar: multiAz maliyeti kabul ediliyor mu? Yedekleme/restore prosedürü belgelenmiş mi? — needs confirmation (iş kararı).
- Etki: yalnız **infra**, prod korumalı — plan + onay şart.

**P2.5 — API throttle'larını sınıra göre ayrıştır** · kapsam: küçük · **⏸️ Büyük ölçüde KAPATILDI; yalnız dar bir Public sigortası açık (2026-07-23 analizi)**
- **Önceki not yanlış öncüle dayanıyordu:** "Public/Protected/Admin üçünde de 100 rps / 200 burst aynı" deniyordu. Kodda **hiçbir API'de throttle tanımı YOK** (grep boş); o 100/200 değerleri AWS'nin hesap-seviyesi örtük default'u. SST `ApiGatewayV2` throttle'ı `args`'ta sunmuyor; ancak stage `transform`'u ile `defaultRouteSettings.throttlingRateLimit/BurstLimit` verilebilir. AdminApi'deki WAF rate-limit bloğu tamamen yorumda (~100$/ay diye kapatılmış).
- **İç API'lerde throttle gereksiz — JWT authorizer zaten kapıda:** Protected/Admin/Owner gateway seviyesinde `jwt` authorizer arkasında ([ProtectedApi.ts:45](infra/ProtectedApi.ts) `addAuthorizer`, route'larda `defaultAuthOptions`). Yetkisiz istek **Lambda'yı tetiklemeden** 401 alır → maliyet yok, DB'ye dokunmaz. Geriye yalnız "çalınmış token" senaryosu kalır; orada da rps tavanı ciddi koruma sağlamaz. Dolayısıyla 4 boundary'lik throttle tablosu **dekorasyon olurdu → yapılmadı.**
- **Açık kalan dar iş (opsiyonel sigorta, acil değil):** Yalnız **PublicApi** anonim ve DB'ye dokunuyor (36 route). Hesap eşzamanlılık kotası **1000** (doğrulandı) olduğundan sistem gerçekten binlerce rps'e çıkabilir → sürekli bir anonim sel hem Lambda maliyeti hem **t4g.micro RDS** baskısı yaratır. İstenirse yalnız PublicApi stage'ine bir tavan konabilir. Gözlenmiş bir sorun değil; öncelik düşük.
- **Yanlış katman uyarısı:** Boundary izolasyonu (bir yüzeydeki patlama diğerlerini aç bırakmasın) rps throttle ile değil **reserved concurrency** ile çözülür — mekanizma zaten env-driven kurulu ama SET EDİLMEMİŞ: [PublicApi.ts:78](infra/PublicApi.ts) `PUBLIC_PRODUCT_ROUTE_RESERVED_CONCURRENCY`, [frontend.ts:85](infra/frontend.ts) `FRONTEND_SERVER_RESERVED_CONCURRENCY`.
- **🔴 Bu analizde bulunan ve düzeltilen canlı sorun — concurrency alarmı yanlış kalibre:** [observability.ts](infra/observability.ts) `ProdLambdaAccountConcurrentExecutionsHigh` eşiği **8**'di, açıklaması ise "limite yaklaşıldı, kotayı artır" diyor. Gerçek kota **1000** (`aws service-quotas get-service-quota --service-code lambda --quota-code L-B99A9384 --region eu-central-1`) → alarm limitin **%0.8**'inde tetikleniyordu ve SSR fan-out'uyla normal trafikte 8 eşzamanlı Lambda kolayca görülür. 2026-07-23'te P1.8(c) ile prod'a çıkmıştı → alarm gürültüsü/körlüğü riski. **Eşik 800'e (kotanın ~%80'i) çekildi**; `LAMBDA_ACCOUNT_CONCURRENCY_ALARM_THRESHOLD` ile hâlâ ezilebilir. **Ders: eşik kotaya göreli anlamlıdır — kota değişirse eşik de güncellenmeli.** Doğrulama: infra tsc temiz. **Deploy gerektirir.**

**P2.6 — SST 4 yükseltme kararı** · kapsam: büyük, ayrı proje
- Ne: `sst@3.19.3` → SST 4 (latest 4.17.0). Not: SST 4, v2→v3 gibi bir rewrite değil — registry'de `ion` dist-tag'i 4.5.2'ye işaret ediyor, yani **aynı Ion çizgisinin devamı**; yine de major atlama olduğu için migration notları okunmadan ve kubi'de denenmeden geçilmez. P0.3'te kalan 4 high severity açığın tamamı SST 3'ün CLI zincirinde (`opencontrol`, `hono`, `@modelcontextprotocol/sdk`, `aws-sdk@2`) ve fix `sst@4.0.7+` gerektiriyor.
- Neden: Güvenlik etkisi sınırlı (bu bileşenler yalnız `sst dev`'de geliştirici makinesinde çalışır, deploy edilen Lambda'lara girmez) ama audit'in bloklayıcı olabilmesi ve SST'nin destek ömrü için orta vadede gerekli.
- Etki: **infra tamamı** + deploy zinciri; prod korumalı — SST 4 migration rehberiyle, önce kubi stage'de uçtan uca denenerek, CLAUDE.md gereği plan+onayla yapılmalı.

**P2.7 — Node 22 → 24 LTS geçişi** · kapsam: orta · **⛔ BLOKE — P2.6 (SST 4) sonrasına ertelendi (2026-07-17)**
- **Bloke gerekçesi (2026-07-17 kod incelemesi, "izole adım" varsayımı YANLIŞ çıktı):** (1) `nodejs24.x` SST 3.19.3'ün runtime union'ında **yok** — [.sst/platform/src/components/aws/function.ts:356-366](.sst/platform/src/components/aws/function.ts) yalnız `nodejs18.x|nodejs20.x|nodejs22.x|go|rust|provided.al2023|python3.9-3.12` kabul ediyor; `runtime: "nodejs24.x"` infra'da tip hatası verir (Pulumi `transform` ile union by-pass edilebilir ama 15 çağrı noktasında hack olur — bilinçli reddedildi). (2) Frontend Next.js Lambda'larının runtime'ı **SST'nin Nextjs component'i içinde `nodejs20.x` olarak hardcoded** ([nextjs.ts:679, 762, 899, 984](.sst/platform/src/components/aws/nextjs.ts): server, image optimizer, revalidation, warmer) → `infra/frontend.ts`'ten değiştirilemiyor. **Bulgu: prod frontend server bugün Node 20'de çalışıyor, 22'de değil.** Dolayısıyla P2.7 ancak P2.6 (SST 4) tamamlandıktan sonra ele alınabilir.
- **Bekleyen küçük iş (P2.6'yı beklemez, ayrı dilim olarak yapılabilir):** [cognito.ts:37](infra/cognito.ts) `postConfirmation` trigger'ı hâlâ `nodejs20.x` (diğer 14 Lambda `nodejs22.x`) ve Node 20 EOL'ü geçti → `nodejs22.x`'e normalize edilmeli; ayrıca [frontend/package.json](packages/frontend/package.json) `@types/node: ^20` runtime'ın (22) gerisinde. `postConfirmation` auth-kritik (VPC+RDS linkli, kayıt sonrası DB kullanıcısı oluşturur) → kubi'de uçtan uca signup testi şart. `.nvmrc` (22.22.2) + `engines` (`>=22 <23`) zaten doğru, değişmez.
- Ne: `.nvmrc` (22.22.2) + root `engines` (`>=22 <23`) + Lambda runtime'ları `nodejs24.x`'e taşı. ARCHITECTURE'a göre bazı Cognito trigger Lambda'ları hâlâ `nodejs20.x` — bu işte hepsi normalize edilmeli. CI, `node-version-file: .nvmrc` okuduğu için otomatik uyar.
- Neden: Node 24 LTS Nisan 2028'e kadar destekli ve AWS Lambda'da mevcut; Node 22 bakımı Nisan 2027'de bitiyor. Acil değil ama planlı yapılmalı.
- Etki: **root config + infra (runtime'lar) + CI + lokal geliştirme**. Kural: başka hiçbir değişiklikle birleştirilmeden, tek başına, kubi'de uçtan uca doğrulanarak (özellikle Prisma native binding'leri ve `next build`).

**P2.8 — Frontend'den core'a doğrudan prisma importlarını kaldır** · kapsam: orta · **Import hijyeni ✅ Uygulandı (2026-07-17); mimari devam işi açık**
- Uygulama notları (2026-07-17): Kırılgan relative path'ler (`../../../../core/src/...`, biri 8 seviye) tsconfig alias'larıyla değiştirildi — **3 dosya, 5 import satırı** (plan 4 diyordu; `geocodingService.ts`'te ayrıca `../../../../core/prisma/generated/prisma/client` importu vardı, o da kapsama alındı). [frontend/tsconfig.json](packages/frontend/tsconfig.json)'a iki alias: `@core/*` → `../core/src/core/*` ve `@core-prisma/*` → `../core/prisma/*` (backend root tsconfig'indeki `@/core/*` + `@/prisma/*` konvansiyonunun aynası; ayrı prefix'ler çakışmaz). **Önce plandaki workspace paket importu (`@ceyhunlarweb/core/...`) denendi ve BAŞARISIZ oldu:** core build step'siz ham TS yayınlıyor (`exports: { "./*": ["./src/*/index.ts", "./src/*.ts"] }`); `tsc` (`moduleResolution: "bundler"`) bunu çözüyor ama **Turbopack çözemedi** → `next build` "Module not found" verdi. `transpilePackages` + package.json bağımlılığı denendi, yetmedi; ikisi de geri alındı (paket-adı importu çalışmadığı için bağımlılığı bırakmak yanıltıcı olurdu). Kazanç: dizin taşımasında bir daha kırılmaz (bir kez kırılmıştı). **Davranış değişmedi.** Doğrulama: frontend tsc ✅ + lint 0 error ✅ + `next build` **"Compiled successfully"** (modül çözümleme kanıtlandı; build sonrasında yalnız SST links hatası veriyor — AWS creds'siz beklenen, değişiklikle ilgisiz). **kubi runtime doğrulaması kullanıcıda.**
- **(a) ✅ Uygulandı (2026-07-17) — varyant sayfasından doğrudan DB erişimi kaldırıldı:** Naif çözüm (`GET /portal/customer` çağırmak) **bilinçli reddedildi**: `mapCustomerForApi` çok sayıda relation'lı ağır yanıt döndürüyor (assignedSalesUser, attributeValueAssignments, companyContactAssignments, addresses…) → tek bir sayı için ekstra round-trip + ağır sorgu = müşteriye bakan sayfada verimlilik kaybı. Yerine: **sayfanın zaten çağırdığı** B0 endpoint'i (`GET /portal/customer/products/{id}/variant-table`) müşterinin genel indirimini de döndürüyor → **ek round-trip YOK**, sorgu yalnız API sınırının arkasına taşındı. **Backend:** customer repository'e DAR metod `getCustomerPricingContext(id)` (`select: { generalDiscountPercent: true }` — `getCustomer`'ın tüm relation'larını çekmemek için); handler `event.user.customerId` ile bunu `Promise.all` içinde paralel çeker, `normalizeCustomerDiscountPercent`'ten geçirip `customerDiscountPercent` olarak döndürür (customer olmayan admin/sales çağrısında `null`); yeni deps tipi [ProtectedApi/types/products.ts](packages/functions/src/ProtectedApi/types/products.ts) (public deps bilinçli dar bırakıldı). **Yakalanan tuzak:** public `productVariantTableResponseValidator`'ın `payload` objesi KATI (`.loose()` yalnız en dış objede) → `z.toJSONSchema` `additionalProperties:false` üretiyor ve yeni alan **500'e dönüşürdü**; public sözleşmeyi gevşetmek yerine endpoint'e kendi şeması verildi ([ProtectedApi/validators/products.ts](packages/functions/src/ProtectedApi/validators/products.ts), iç objeler `.loose()`). **Frontend:** server fn dönüş tipi `customerDiscountPercent` taşır; [sayfadan](packages/frontend/app/(panels)/musteri/tum-urunler/urun/[slug]/varyantlar/page.tsx) `prisma`, `normalizeCustomerDiscountPercent` **ve** `auth()` importları kalktı (session yalnız bu sorgu içindi → sayfa başına bir `auth()` çağrısı da eksildi). `CustomerPortalVariantDetailsTable` DEĞİŞMEDİ. Doğrulama: backend tsc ✅ frontend tsc ✅ lint 0 error ✅ core 110 + functions 4 + frontend 16 test ✅ `next build` "Compiled successfully" ✅. **✅ prod'a deploy edildi (2026-07-23).**
- **🔴 PRODUCTION BUG bulundu ve düzeltildi (2026-07-17) — variant-table endpoint'leri 400 dönüyordu:** P2.8(a) test edilirken müşteri portalı varyant sayfası hata verdi; teşhis, sorunun P2.8(a) ile ilgisiz ve **canlıda mevcut** olduğunu gösterdi. **Kök neden:** Category Translation pilotu (2026-07-16) `idValidator`'a `queryStringParameters: z.object({ locale })` ekledi; bu obje KATI olduğu için (`.loose()` yok) `z.toJSONSchema` `additionalProperties: false` üretiyor ve [validatorWrapper](packages/core/src/core/helpers/validation/validatorWrapper.ts) `additionalProperties: true`'yu **yalnız KÖK şemaya** uyguluyor → `limit` gönderen her istek `400 "must NOT have additional properties: limit"` alıyordu. **Etki:** variant-table'ı çağıran DÖRT yol da `limit=500` gönderiyor → public SSR ürün sayfası, public client api, workspaceProducts ve müşteri portalı. Yani **SEO-kritik public ürün sayfasındaki varyant tablosu da bozuktu** ve P1.8f'te eklenen "Varyant bilgisi yüklenemedi" mesajını gösteriyordu (hata sessiz kalmadı ama sebebi görünmüyordu). **Düzeltme:** yeni `productVariantTableRequestValidator` ([PublicApi/validators/products.ts](packages/functions/src/PublicApi/validators/products.ts)) — `pathParameters.id` + `queryStringParameters { locale, page, limit, search, sort, order }` (query değerleri string gelir; sayısal ayrıştırmayı `normalizeListQuery` yapar); public ve customer variant-table action'ları bu validator'a geçirildi. **AJV ile kanıtlandı:** eski validator `limit`'i kullanıcının gördüğü hatayla reddediyor, yenisi kabul ediyor; `locale`+`limit` birlikte geçiyor, query'siz istek geçiyor, bilinmeyen param hâlâ reddediliyor. **Ayrıca:** [getCustomerProductVariantTable.ts](packages/frontend/features/customerPortal/server/getCustomerProductVariantTable.ts) `catch` bloğu Next.js kontrol-akışı hatalarını (`digest` taşıyanlar: redirect/notFound/dinamik bailout) artık YUTMUYOR ve log tek-satır string (obje loglanınca Next overlay `{}` gösteriyordu → gerçek sebep görünmüyordu). **Ders (CLAUDE.md'ye eklendi):** `validatorWrapper` `additionalProperties:true`'yu yalnız kök şemaya uygular; iç `queryStringParameters`/`body` objeleri katıdır — query param gönderen bir route'a `idValidator` verme. **Deploy gerektirir** (prod'daki public bug ancak deploy'la kapanır).
- **Panel ilk-yük dilimi ✅ Uygulandı (2026-07-17) — /musteri overview yavaşlığı (kullanıcı talebi, analiz + 2 düzeltme):** Analiz, spinner süresinin 4 katmanlı zincir olduğunu gösterdi: boş RSC shell → hydrate → SessionProvider session fetch → axios interceptor'da HER istekte İKİNCİ `getSession()` HTTP round-trip'i (next-auth v4 context cache kullanmaz) → `GET /portal/customer` = `customerDetailInclude` tam ürün ağaçları (ürün başına ~175KB sınıfı, sayfa ürünleri RENDER ETMEZKEN — yalnız `.length` sayaçları). **(1) Slim overview endpoint'i:** repo'ya `customerPortalOverviewInclude` (= `customerBaseInclude` + portalUsers + addresses + `_count{featuredProducts,assignedProducts}`; ürün ağaçları YOK) + `getCustomerPortalOverview(id)`; yeni handler `getPortalCustomerOverviewHandler` (crm/handlers.ts — `_count` spread'e sızmadan ayrıştırılır, `mapCustomerForApi` optional-safe olduğundan aynen kullanılır, count'lar customer objesi İÇİNE konur); actions `getPortalCustomerOverview` (auth customer/admin/owner, `customerResponseValidator` — customerSchema `.loose()` count'ları kabul ediyor, **AJV ile kanıtlandı**, bugünkü 400 dersinden sonra varsayılmadı); route `GET /portal/customer/overview` ([ProtectedApi.ts](infra/ProtectedApi.ts)). Frontend: [getPortalCustomerOverview.ts](packages/frontend/features/customerPortal/api/getPortalCustomerOverview.ts) + [usePortalCustomerOverview.ts](packages/frontend/features/customerPortal/hooks/usePortalCustomerOverview.ts) (agresif refetch YOK — global default'lar; eski hook'un `refetchOnMount:"always"`+focus'u bilinçli kopyalanmadı); overview sayfası + ProfileSummaryCard count alanlarına geçti (`featuredProductCount`/`assignedProductCount`, length fallback'li). `usePortalCustomer` DEĞİŞMEDİ (diğer kullanıcıları tam endpoint'te kalır). **(2) Token cache ([client.ts](packages/frontend/lib/http/client.ts)):** admin+protected interceptor'ları artık her istekte `getSession()` HTTP round-trip'i yapmaz — module-level cache (JWT `exp` - 60sn marj), single-flight, 401'de invalidation; exp decode edilemezse eski davranışa güvenli düşüş. **Tüm panel API çağrıları hızlanır.** Kazanç: overview payload MB-sınıfı → ~onlarca KB + istek başına -1 seri HTTP. Pattern memory'e kaydedildi (panel-first-load-pattern). Doğrulama: backend+frontend tsc ✅ lint 0 error ✅ core 110 + functions 4 + frontend 16 test ✅ build "Compiled successfully" ✅. **✅ prod'a deploy edildi (2026-07-23).** **Dilim 3+4 ✅ Uygulandı (2026-07-20):** (3) yeni RSC server fn [server/getPortalCustomerOverview.ts](packages/frontend/features/customerPortal/server/getPortalCustomerOverview.ts) (B0 deseni: React `cache()` + `protectedServerClient`, `unstable_cache` yok, `digest` hataları yutulmaz, hata→null); [/musteri/page.tsx](packages/frontend/app/(panels)/musteri/page.tsx) async olup `initialOverview` prop'u geçiyor; hook `initialData` alıyor → **ilk boya spinner'sız dolu**, server fetch hatasında client-fetch'e zarif düşüş. Slim DTO sayesinde RSC flight payload'u güvenli (dilim sırasının sebebi). (4) [usePortalCustomer.ts](packages/frontend/features/customerPortal/hooks/usePortalCustomer.ts) `refetchOnMount:"always"`+`refetchOnWindowFocus:true` kaldırıldı (4 tüketici, shape değişmedi, yalnız yeniden-çekme sıklığı global default'lara indi); [providers.tsx](packages/frontend/app/providers.tsx) `ReactQueryDevtools initialIsOpen` true→false. Doğrulama: frontend tsc ✅ lint 0 error ✅ 16 test ✅ build "Compiled successfully" ✅. **✅ prod'a deploy edildi (2026-07-23).**
- **Kalan mimari borç (ayrı iş, dosya bazında farklı):** (b) `features/auth/server/user-access.ts` auth akışının içinde, token'dan önce çalışıyor → HTTP'ye çevirmek latency + bootstrap sorunu yaratır, **doğrudan erişim savunulabilir**, düşük öncelik; (c) `features/customerLocations/server/geocodingService.ts` → **⏸️ Ertelendi; kapsam yeniden sınıflandırıldı (2026-07-23).** Önceki not "PublicApi'de zaten geo endpoint'leri var, **kısmi tekrar**" diyordu — kod incelemesi bunun **YANLIŞ** olduğunu gösterdi. Mevcut `GET /geo/countries`, `/geo/countries/{countryId}/states`, `/geo/states/{stateId}/cities` **hiyerarşik forward listeleme** yapar (parent ID ile, salt okuma, seçici dropdown'ları besler). `geocodingService` ise bambaşka bir iş yapar: Nominatim'den (`nominatim.openstreetmap.org`) gelen sonucu **isim/iso2 ile fuzzy eşleyip** bizim geo kayıtlarımıza bağlar, ayrıca `geocodingCache` tablosuna **YAZAR** (upsert) ve provider rate-limit'i için in-memory cooldown + in-flight dedup tutar (352 satır). Yani ortak olan tek şey aynı tabloları kullanmaları; mevcut endpoint'ler bu işi **karşılayamaz** — "reuse" seçeneği yok. Gerçek iş: geocoding proxy'sinin tamamını backend'e taşımak = yeni endpoint'ler (search + reverse) + `geocodingCache` repository'si + Next route'larını (`app/geocoding/search|reverse/route.ts`, `auth()` ile customer/sales/admin yetkilendirmesi yapıyorlar) proxy'ye çevirme. **Kapsam: orta-büyük taşıma projesi, ~2 dilim** — "düşük riskli import temizliği" DEĞİL. **Açık tasarım sorusu:** in-memory cooldown/in-flight dedup Lambda'da container başına çalışır → provider rate-limit davranışı değişir; taşımadan önce buna karar verilmeli (DynamoDB/cache tablosu ile dağıtık kilit mi, yoksa kabul mü). Mevcut kurulum savunulabilir (route handler'lar auth kontrollü, cooldown tek process'te tutarlı); somut bir bug/performans sorunu çözmediği için önceliği düşük.
- Ne: Üç dosya `packages/core`'a relative path ile doğrudan import atıyor (i18n taşımasında yakalandı): [musteri varyant sayfası](packages/frontend/app/(panels)/musteri/tum-urunler/urun/[slug]/varyantlar/page.tsx) (`prisma` + pricing helper), `features/auth/server/user-access.ts` ve `features/customerLocations/server/geocodingService.ts` (`prisma`). Frontend server Lambda'sı VPC'de ve RDS'e linkli olduğu için çalışıyor, ama AGENTS.md veri akışı kuralına aykırı ve kırılgan (dizin taşımalarında path bozuluyor — bir kez oldu).
- Neden: Veri erişimi API boundary'lerinden geçmeli; en azından relative path yerine workspace paket importu (`@ceyhunlarweb/core`) kullanılmalı.
- Etki: **frontend** (3 dosya) + davranış değişikliği riski düşük ama SSR performansı/connection kullanımı gözden geçirilmeli.

## i18n — İngilizce Desteği (P1.1, Detaylı Plan)

### Strateji özeti
- **Kütüphane: `next-intl`** — App Router + RSC için fiili standart; Server Component'te `getTranslations`, client'ta `useTranslations`, `[locale]` segment routing ve hreflang desteği hazır.
- **URL modeli: `localePrefix: "as-needed"`** — mevcut TR URL'ler (`/hakkimizda`, `/urun/[slug]`) **hiç değişmez** (SEO ve mevcut linkler korunur), İngilizce `/en/...` altında yaşar. Bu, "hiçbir şeyi bozma" kısıtıyla uyumlu tek modeldir.
- **Kapsam fazlara bölünür** — 412 dosyalık TR string yüzeyi tek seferde göç ettirilmez:

| Faz | Kapsam | Tahmini yüzey |
|---|---|---|
| Faz 1a | i18n altyapısı: `[locale]` segmenti, middleware, `messages/tr.json` + `en.json`, `html lang`, provider | Yapısal — `app/` ağacının `app/[locale]/` altına taşınması (tüm route grupları) |
| Faz 1b | `(public)` 19 sayfa + public features + auth ekranları | ~70-90 dosya |
| Faz 1c | SEO: `generateMetadata` locale-aware, `alternates.languages` (hreflang), `sitemap.ts` + `robots.ts` (yeni), OG locale | 19 public sayfa + root layout |
| Faz 2 | Panel yüzeyleri (admin/satış/satın alma/portal) — iç kullanıcılar TR çalışıyorsa ertelenebilir (iş kararı — needs confirmation) | ~280 dosya |
| Faz 3 | Backend mesajları + bildirim/e-posta mimarisi | 26 functions + 13 core dosyası + şema değişikliği |

### Kritik mimari kararlar (Faz 1'de verilmesi gerekenler)

1. **`app/` ağacı taşıması tek yapısal risktir.** `app/[locale]/(public)/...` yapısına geçiş admin/portal route'larını da taşımayı gerektirir (Next'te `[locale]` segmenti ağacın tepesinde olmalı). Paneller çevrilmese bile route'ları taşınır ve `tr` locale'iyle çalışmaya devam eder. Bu taşıma tek PR'da, davranış değişikliği olmadan, tüm yüzeylerin smoke testiyle yapılmalı.
2. **Rota çevirisi (pathnames) Faz 1'de yapılmamalı.** `/en/hakkimizda` ilk fazda kabul edilebilir; `next-intl`'in `pathnames` config'i ile `/en/about` eşlemesi Faz 1c/2'de eklenebilir. Erken slug çevirisi hem redirect matrisi hem hreflang karmaşası yaratır.
3. **DB içeriği Translation Table ile model bazında taşınır.** Category pilotu additive `CategoryTranslation` tablosuyla başlatıldı; legacy `Category.name`/`Category.slug` alanları geçiş tamamlanana kadar korunur. Product, attribute ve `usageFunction` gibi diğer dinamik içerikler aynı pilot doğrulandıktan sonra ayrı migration'larla ele alınır.
4. **Bildirim persist mimarisi i18n'in en zor problemi**: [messaging.ts](packages/core/src/core/helpers/userAccess/messaging.ts) ve [businessRequests/messaging.ts](packages/core/src/core/helpers/businessRequests/messaging.ts) bildirimleri **üretim anında TR metin** olarak `UserNotification`'a yazıyor. Doğru hedef: `templateKey + params` persist edip render anında çevirmek — ama bu, migration + tüm subscriber ve frontend notification okuma zincirinin senkron değişimini gerektirir → **Faz 3**. Faz 1-2'de bildirimler TR kalır.
5. **Backend hata mesajları için kod tabanlı yaklaşım**: response'lara makine-okur `code` alanı ekle (backward compatible — mevcut TR `message` alanı korunur), frontend `code`'u kendi locale'inde çevirir. Alternatif olan Accept-Language ile backend çevirisi, [middy.ts](packages/core/src/core/middy.ts)'deki hazır `httpContentNegotiation` sayesinde mümkün ama e-posta/bildirim gibi async bağlamlarda dil bilgisi taşımadığı için eksik kalır. Kod tabanlı yaklaşım önerilir. E-postalar için Faz 3'te `User.preferredLocale` alanı (şema değişikliği — onaylı migration).

### Dinamik içerik — Category Translation Table pilotu (2026-07-16)

**Durum (2026-07-17):** `feature/category-translation-pilot` branch kapsamı tamamlandı. ✅ Additive `CategoryTranslation` schema/migration'ı, ✅ TR backfill scripti, ✅ locale-aware Category repository sorguları, ✅ Public/Admin API validator ve handler güncellemeleri, ✅ admin çeviri düzenleme akışı, ✅ public kategori slug/hreflang/sitemap desteği, ✅ DeepL tabanlı EN taslak üretme/apply CLI'ı ve ✅ README runbook'u branch kapsamına dahil edildi. ✅ `kubi` stage'de migration, backfill, admin EN çeviri kaydı ve TR/EN public API davranışı doğrulandı. Production için kalan iş kod değişikliği değil, merge sonrası runbook sırasıdır: snapshot → migration deploy → prod deploy → backfill → EN çeviri planı/apply → smoke test. Legacy `Category.name`/`Category.slug` kolonlarının kaldırılması bu branch'in parçası değildir; ayrı migration ve gözlem sonrası ele alınacaktır.

- Dil kolonu `language` değil `locale` olarak adlandırılır. URL, içerik seçimi ve formatlama bağlamını aynı BCP 47 uyumlu kavramla taşır; ilk değerler `tr`/`en`, ileride `de` veya bölgesel ihtiyaç varsa `en-GB` gibi değerler eklenebilir.
- `CategoryTranslation` için `@@unique([categoryId, locale])` bir kategoride locale başına tek kayıt; `@@unique([locale, slug])` ise locale içindeki slug benzersizliğini garanti eder. Exact slug çözümü bu B-tree indeksini kullanır.
- API dış kontratı düz kalır: tüketici seçilen locale için yine `name`/`slug` alır. `resolvedLocale`, `translationMissing`, `alternateSlugs` ve `translations` alanları fallback, hreflang ve admin düzenleme için eklenir.
- Eksik çeviri politikası açıktır: public API Türkçe kaynağa fallback yapar ve `translationMissing: true` döner; eksik EN kategori sayfası `noindex` olur ve sitemap'e alınmaz.
- Localized slug ilk translation oluşturulurken üretilir. Mevcut EN çeviri adı güncellendiğinde slug otomatik değişmez; yalnız API'ye açık slug gönderilirse değişir. Admin UI manuel slug değişikliği açmadan önce eski slug → yeni slug redirect geçmişi (`CategorySlugRedirect` benzeri) tasarlanmalıdır. Legacy TR ad güncellemesinin mevcut slug yenileme davranışı pilotta korunur.
- Arama ve listeleme tek repository sorgu sınırında relation filtresiyle yapılır; kategori başına sorgu atan N+1 yaklaşımı kullanılmaz. Public/server ve admin liste limitleri pilotta 500'e eşitlendi; admin arama ve pagination server-side çalışır.

**Production migration runbook (veri kayıpsız, iki aşamalı deploy):**

1. Production yedeği/PITR durumu ve migration hedefi doğrulanır. `20260716120000_add_category_translations` migration'ı yalnız yeni tablo, indeks ve foreign key ekler; legacy kolonları değiştirmez.
2. Migration önce uygulanır. Yeni uygulama kodu, tablo oluşmadan deploy edilmez.
3. Locale-aware/fallback/dual-write uygulama kodu deploy edilir. Boş translation tablosu legacy TR fallback sayesinde okunabilir; admin ve supplier workflow Category create/update işlemleri bu andan itibaren legacy alanlarla `tr` translation'ı aynı transaction içinde yazar.
4. `npm --workspace packages/core run backfill:category-translations` dry-run çalıştırılır; toplam, eksik ve farklı TR kayıt sayıları incelenir.
5. Sonuç onaylandıktan sonra aynı komut `-- --apply` ile çalıştırılır. Script yalnız eksik `tr` kayıtlarını batch halinde ekler, var olan translation kayıtlarını overwrite etmez ve sonunda eksik kayıt kalmadığını doğrular.
6. Dry-run ikinci kez çalıştırılır. `missing=0` ve `divergent=0` olmadan İngilizce içerik girişi başlatılmaz; divergent kayıt varsa legacy/translation değerleri manuel incelenir.
7. Gözlem süresince TR/EN slug çözümü, fallback/noindex, admin create/update/delete-EN, pagination ve sitemap izlenir. Sorunda uygulama eski sürüme alınabilir; additive tablo legacy okuma yolunu bozmaz. Eski sürüm Category yazdıysa tekrar ileri deploy öncesi dry-run/drift kontrolü zorunludur.
8. Legacy kolonların silinmesi bu pilotun parçası değildir. Tüm reader/writer'lar translation tablosuna geçtiği, drift raporu sıfır olduğu ve ayrı migration onayı verildiği zaman yeni bir branch/migration ile ele alınır.

**`pg_trgm` kararı:** Category exact slug sorguları mevcut composite B-tree unique indeksleriyle çözülür; pilotta extension eklenmez. Çok dilli ProductTranslation veya büyük `contains` aramalarında gerçek veri hacmiyle `EXPLAIN (ANALYZE, BUFFERS)` ölçümü yapılır. Sequential scan/latency ihtiyacı doğrulanırsa `CREATE EXTENSION IF NOT EXISTS pg_trgm` ve locale-aware GIN trigram indeksleri ayrı, geri alınabilir bir migration olarak değerlendirilir.

### Dinamik içerik — Varyant sözlükleri (Color / Material / MeasurementType) · ✅ merge + prod deploy (2026-07-23)

Category pilotunun kanıtladığı Translation Table deseninin ikinci uygulaması; **Codex ile geliştirildi**, `feature/product-variant-dictionary-translations` olarak merge edildi (PR #4, `14edaef`) ve **prod'a deploy edildi**. Bu not kod taramasıyla yazıldı (ajanlar arası devralma için).

- **Şema/migration:** `20260723120000_add_variant_dictionary_translations` — additive üç tablo: `ColorTranslation`, `MaterialTranslation`, `MeasurementTypeTranslation` (`locale String @db.VarChar(16)` + `name`; measurement type ayrıca kendi ek alanlarını taşır). Category pilotundaki gibi legacy `name` kolonları korunur.
- **Core:** yeni `helpers/variantDictionaries/` modülü — `localizeVariantDictionary`, `variantDictionaryTranslations`, `variantDictionaryTranslationDraft` (+ birim testleri). `colors`/`materials`/`measurementTypes`/`productVariants` repository'leri locale-aware oldu; `mapPublicProductVariantTableRow` (+ testi) sözlük çevirilerini taşıyacak şekilde güncellendi.
- **Scriptler:** `backfill-variant-dictionary-translations.ts` (TR backfill) + `translate-variant-dictionary-translations.ts` (EN taslak üretme/apply) — Category pilotundaki CLI deseninin aynısı.
- **API:** Public + Admin `colors`/`materials`/`measurementTypes` handler & validator'ları locale query'sini kabul eder; ProtectedApi colors validator'ı ve **her iki variant-table handler'ı** (public + customer) güncellendi.
- **Frontend:** yeni admin yüzeyleri `app/(panels)/admin/colors` ve `admin/measurement-types` (+ AdminSidebar girdileri); admin `colors`/`materials`/`measurementTypes` feature'ları çeviri düzenleme akışına geçti; public `ham-madde-sertifikalari`, `urun/[slug]`, `varyantlar` sayfaları ve `ProductVariantTable` lokalize sözlük değerlerini kullanır.
- **Validator tuzağı kontrol edildi (2026-07-23):** Bu merge, Category pilotunun 400 regresyonunu (bkz. P2.8 altındaki PRODUCTION BUG notu) **tekrarlamadı** — `/categories` gibi liste route'larının validator'ları pagination'ı beyan ediyor, tekil kaynak çağrıları yalnız `locale` gönderiyor; kesişim temiz. Risk latent kalıyor ve CLAUDE.md "bilinen tuzaklar"da belgeli: query param gönderen route'a genel `idValidator` verme.
- **Kalan:** legacy `name` kolonlarının kaldırılması bu işin parçası DEĞİL (Category pilotuyla aynı politika: tüm reader/writer'lar translation tablosuna geçip drift sıfırlandıktan sonra, ayrı migration onayıyla). Prod'da EN çeviri içeriğinin girilmesi/uygulanması runbook işidir.

### Faz 1b ilerleme
- **✅ CustomerLeadDialog ✅ (2026-07-09) — Faz 1b public/auth i18n TAMAM:** numune talep formu (689 satır, 5 adımlı wizard) — [components/home/CustomerLeadDialog.tsx](packages/frontend/components/home/CustomerLeadDialog.tsx) (`public.customerLead` 37 key). Modül-seviyesi zod şeması kurulu factory desenine çevrildi: `buildCustomerLeadSchema(tv)` + `useMemo(() => buildCustomerLeadSchema(tv), [tv])`; tip `z.infer<ReturnType<...>>`. Şema client-only (form doğrulaması), server tüketmiyor — Faz 3 gerekmez. `STEP_TITLES` module const'tan `t`-tabanlı in-component array'e; `buttonLabel` default'u `?? t("title")` deseniyle. Navbar + MobileMenu'den tetikleniyor (chrome, zaten çevrildi). Doğrulama: leftover TR 0 + typecheck + build + 13 test + parity 749. **Faz 1b'nin public/auth/home + dinamik chrome kapsamı bitti; kalan yüzeyler paneller (Faz 2) ve backend/bildirim mesajları (Faz 3).**
- **✅ Dinamik sayfa chrome'u TAMAM — Dyn Unit 3 ✅ (2026-07-09):** varyant yüzeyi — `urun/[slug]/varyantlar` sayfası + `ProductVariantTable` (731 satır), `ProductVariantDetailsTable`, `ProductVariantHeaderActions`, `ProductVariantNavigationOverlay` (`public.productVariant` 61 key). **Önemli mimari karar:** `ProductVariantTable`/`NavigationOverlay` yalnız public değil, **paneller de** (`app/(panels)/musteri/tum-urunler/...` + admin özel fiyat/atanmış varyant client'ları) render ediyor — paneller `[locale]` ağacının dışında ve `NextIntlClientProvider`'sızdı. `useTranslations` eklemek panelleri çökertirdi; çözüm: [app/(panels)/layout.tsx](packages/frontend/app/(panels)/layout.tsx)'e TR-sabit `NextIntlClientProvider` sarıldı (props'suz — `i18n/request.ts` panel route'larında locale'i zaten TR'ye düşürüyor; panel metinleri TR kalır, sadece paylaşılan bileşenin next-intl çağrıları çözülür). Yakalanan **ASCII-yazılı TR** (diakritik grep kaçırır): "aciliyor", "goster", "hazir", "Secilen" (sr-only + aria-label metinleri). varyant sayfasına `generateMetadata` (canonical + hreflang + og:locale) eklendi (önceden hiç metadata yoktu). WhatsApp mesajı `{name}`/`{url}` placeholder'larıyla, count badge'leri ICU `{count}` ile. **Dinamik chrome üç ünitesi de bitti** (filtre/detay/varyant). Doğrulama: leftover TR 0 (yalnız TR yorumlar) + typecheck + build (ƒ dinamik, paneller crash'siz) + 13 test + parity 712.
- **🔄 Dinamik sayfa chrome'u — Dyn Unit 2 ✅ (2026-07-09):** ürün detay yüzeyi — `urun/[slug]` sayfası + `ProductHero`, `ProductAttributeBadges`, `ProductQuickNav`, `ProductUsageAreasTable`, `InteractiveZoomImage`, `SimilarProductsRow`, `ProductAssetFeatureSection` + 4 asset wrapper (`Certificate`/`TechnicalDrawing`/`AssemblyVideo`/`3DModel`) + ölü `ProductMediaRow`/`ProductAssets` (`public.productDetail` 67 key). DB içeriği (ürün/kategori/attribute/usageFunction) TR kalır. Desen notları: `ProductAssetFeatureSection` presentational bırakıldı (yeni `requestInfoLabel`/`offerImageAlt` prop'ları), i18n 4 wrapper'a taşındı — wrapper'lar `"use client"` oldu çünkü `ProductHero` (client) inline video için `AssemblyVideoSection` render edebiliyor (async server component olamaz). `ProductQuickNav`/`items` ve `ProductAttributeBadges/formatAttributeName` module-scope'tan hook'a taşındı; `InteractiveZoomImage` default-prop metinleri `?? t()` deseniyle. Hiç render edilmeyen `missingMessage` prop'u (yorumlu blok) 4 wrapper'dan düşürüldü. urun/[slug] metadata hardcoded `.com.tr` → relative canonical + hreflang. **Kalan Dyn ünitesi:** Unit 3 = varyant (`urun/[slug]/varyantlar` + ProductVariantTable 731 satır). Doğrulama: leftover TR 0 + typecheck + build (ƒ dinamik) + 13 test + parity 651.
- **🔄 Dinamik sayfa chrome'u — Dyn Unit 1 ✅ (2026-07-08):** filtre yüzeyi — `urunler/filtre` + `urun-kategori/[slug]` sayfaları + paylaşılan `ProductFilterSidebar`/`ProductFilterList`/`ProductFilterPopoverSelect` + `ProductCard` (`public.productFilter` 24 key + `shared.productCard` 1). DB içeriği (kategori/ürün/attribute adları) TR kalır — yalnız chrome/filtre etiketleri çevrildi. ProductCard/PopoverSelect'te `label`/`code` gibi default-prop metinleri hook'la çözüldü. Yakalanan diakritiksiz TR: "Kategoriler"/"Kod" (ilk grep kaçırmıştı). ProductFilterList'teki büyük ölü server-component bloğu + kategori sayfasındaki ölü "Gelişmiş Filtreye Git" bloğu silindi. urun-kategori metadata'sındaki hardcoded `.com.tr` düzeltildi + hreflang. **Kalan Dyn üniteleri:** Unit 2 = ürün detay (`urun/[slug]` + ProductHero/MediaRow/UsageAreasTable/Certificate/…), Unit 3 = varyant (`urun/[slug]/varyantlar` + ProductVariantTable 731 satır). Doğrulama: typecheck + build + 13 test + parity 584.
- **✅ Dil değiştirici UI (2026-07-08):** [LanguageSwitcher.tsx](packages/frontend/components/navigation/LanguageSwitcher.tsx) — kompakt TR/EN segmented control; `usePathname`+`useRouter` (@/i18n/navigation) ile mevcut yolu koruyarak locale değişir (dinamik segmentler için `params` router.replace'e geçirilir). TopBar (masaüstü) + MobileMenu'ye eklendi. Yalnız public navbar'da görünür (paneller TR-only, kendi layout'ları). Doğrulama: typecheck + build + iki dilde doğru aktif locale render + 13 test.
- **✅ Pilot: `hakkimizda` (2026-07-08)** — desen oturdu: 32 key (`public.about.*` + `common.siteName`), rich text başlıklar `t.rich` + `<highlight>`/`<br>` tag'leriyle, kategori kartlarında `next/link` → `@/i18n/navigation` Link (EN'de locale korunur), `generateMetadata` locale-aware (canonical + hreflang `tr`/`en`/`x-default` + `og:locale`), [app/sitemap.ts](packages/frontend/app/sitemap.ts) locale-aware iskeletiyle kuruldu (13 statik sayfa; dynamic girişler Faz 1c). Doğrulama build artefaktlarından: TR/EN prerendered HTML'de title/canonical/hreflang/içerik kontrolü. İki bilinçli normalizasyon: sayfa title'ı artık template üzerinden tek "| Ceyhunlar Plastik" eki alıyor (eskiden sayfa tam başlık yazıp template ile çiftlenme riski taşıyordu) ve `og.url: "/hakkimizda.jpg"` bug'ı kaldırıldı (URL yerine görsel path'i yazılmıştı).
- **✅ Chrome: navbar + footer + mobil menü (2026-07-08)** — `chrome.*` namespace'i (45 key): 6 nav başlığı, kurumsal/hizmet menü öğeleri (constants key-tabanlı yapıldı — [constants/corporates.ts](packages/frontend/constants/corporates.ts) ve services.tsx artık yalnız `{key, href}` tutar, metinler katalogda), mobil menü, sepet CTA'sı, footer (17 metin). 15 chrome bileşeninde iç linkler `@/i18n/navigation` Link'e geçti; dış (sosyal/tel) linkler `next/link`'te bırakıldı (i18n Link dış URL için kullanılmaz). Bilinçli düzeltme: mobil menü kapatma butonunun aria-label'ı İngilizce hardcode'du ("Close Menu") → artık locale'e göre. Doğrulama: typecheck + build + iki dilin prerendered HTML'inde 6'şar chrome metni birebir mevcut. Yakalanan ölü kod (kök `Navbar.tsx`/`Footer.tsx`, `NavigationContactButton`) ayrı temizlik işi olarak işaretlendi.
- **✅ Chrome dialogları + FORM+ZOD deseni kuruldu (2026-07-08)** — ProductRequest/CatalogRequest/Mail dialogları (`chrome.dialogs.*`, 40 key). **Proje geneli karar:** modül-seviyesi zod şemaları hook'a erişemediği için **factory deseni** seçildi — [schemas.ts](packages/frontend/components/dialogs/schemas.ts) artık `buildXSchema(t)` fonksiyonları export ediyor (mesajı key olarak saklayıp render'da çevirme alternatifi yerine); bileşen `useTranslations(".validation")` ile besliyor, şema saf/`(key)=>string` bağımlı kalıyor. Auth şemaları ve gelecekteki tüm formlar bunu izleyecek (skill'in "ilk şema deseni belirler" kuralı). `BaseFormDialog` iç metinleri (submit/submitting/toast/spinner) `chrome.dialogs.common`'dan geliyor. Doğrulama: typecheck + build + iki dilde trigger metinleri + 13/15 test. **CustomerLeadDialog (689 satır) bu üniteye dahil edilmedi** — ayrı ve büyük, kendi ünitesi olacak.
- **✅ Statik sayfa: `surdurulebilirlik` (2026-07-08)** — 3 içerik bileşeni + paylaşılan `Enviroment` (home ile ortak → `shared.enviroment` namespace'i, 5 key). `public.sustainability` 26 key. Parametreli sertifika alt metni ICU ile (`certAlt` + `{number}`, 4x), rich başlıklar motion.span'i koruyarak `t.rich` (highlight fonksiyonu motion.span döndürüyor). SustainabilityImpact bir server component — next-intl `useTranslations` server'da da çalışıyor, `"use client"` gerekmedi. Doğrulama: typecheck + build + iki dilde title/hreflang/içerik. Ders: home ile paylaşılan bileşenler (`Enviroment`) bir statik sayfada render ediliyorsa o sayfa tam EN olması için birlikte çevrilmeli → `shared.*` namespace'i.
- **✅ Statik sayfa: `ik` / İnsan Kaynakları (2026-07-08)** — hero (3 kart key-tabanlı) + CV başvuru formu (`public.hr`, 38 key). Form+zod factory deseni **ikinci kez** uygulandı (File upload + refine kuralları dahil — `buildHrFormSchema(t)`). Metadata'daki hardcoded `.com.tr` URL'leri düzeltildi (canonical/alternates relative, JSON-LD structured data `siteUrl`'den — canlı `.xyz` domaininde artık doğru). `keywords` array'i `t.raw()` ile locale'e göre. Doğrulama: typecheck + build + iki dilde title/hreflang/JSON-LD/içerik + 13 test.
- **✅ BATCH: 3 servis sayfası `talasli-imalat` + `3d-baski-ve-tarama` + `arge-ve-prototipleme` (2026-07-08)** — yapısal olarak aynı (PageHero + prose blokları), tek turda. `public.machining`+`public.printing3d`+`public.arge` (70 key) + `shared.breadcrumbs` (2 key). **Yeni desenler:** (a) liste blokları `t.raw("items")` array'iyle (JSON'da `[{title,text}]` / `[string]`) → tekrarlı JSX map'e indi, ~150 satır boilerplate silindi; (b) paylaşılan breadcrumb'lar `shared.breadcrumbs`, `PageHero` `next/link`→`@/i18n/navigation` Link (tüm sayfalarda breadcrumb linkleri artık locale-aware). Üçünün de **metadata'sı yoktu** — locale-aware `generateMetadata` + hreflang eklendi (SEO kazanımı). Doğrulama: typecheck + build + 6 sayfa-locale title/hreflang/içerik + 13 test.
- **✅ BATCH: `oneri-sikayet` + `iletisim` (2026-07-08)** — `public.suggestion` (form, factory schema 3. kez — radio enum + consent checkbox refine dahil) + `public.contact` (içerik + statik form + ulaşım kartları). Toplam 44 key. **`iletisim` client→server split:** sayfa `"use client"` idi ve metadata alamıyordu → içerik [ContactContent](packages/frontend/features/public/contact/components/ContactContent.tsx)'e taşındı, page.tsx server-wrapper oldu (locale-aware metadata + hreflang). **Bonus:** bu split sayesinde iletisim eskiden dynamic'ken artık **SSG** (statik prerender) — SEO + performans kazanımı. Doğrulama: typecheck + build + 4 sayfa-locale + 13 test.
- **✅ BATCH: `seri-uretim` + `kataloglar` (2026-07-08)** — `public.massProduction` (5 alt bölüm: metal büyük + plastic/rubber/bakelite; tab'lı scroll-spy) + `public.catalog`. Toplam 72 key. Metal'in 3 uzun liste bloğu (`items` 6× {title,text}, `designItems`/`moldItems` 4'er) `t.raw()` array'iyle → ~180 satır boilerplate silindi. **`seri-uretim` client→server split** ([MassProductionContent](packages/frontend/features/public/massProduction/components/MassProductionContent.tsx) — tab/scroll client'ta, page server-wrapper) → eskiden dynamic'ti, artık **SSG**. Bilinçli düzeltme: metal görsel alt'ları "Talaşlı İmalat" copy-paste bug'ıydı (seri üretim sayfasında yanlış) → "Sac Metal Seri Üretim" olarak düzeltildi. Doğrulama: typecheck + build (ikisi de SSG) + 4 sayfa-locale + 13 test.
- **✅ home (anasayfa) TAMAMLANDI — Unit A + B + C (2026-07-08):** Unit A = Hero/About/Services (+ColorChangeCards)/Quality (+ProductHighlights)/Products/HomeToasts. Unit B = ProcessAndContactSection (süreç + 4 feature + iletişim formu). Unit C = ProductAssistantModal (3 adımlı ürün asistanı wizard). `home.*` namespace (92 key; array'ler `t.raw()`: hero.words, services.cards, quality.highlights, process.features, assistant.steps). Form+zod factory 4. kez (`buildContactFormSchema`). Navigasyon locale-aware: Hero/Products/ColorChangeCards `next/link`→`@/i18n/navigation`, asistan `useRouter` de `@/i18n/navigation` (EN'de `/en/urunler/filtre`'ye push). DB içeriği (sektör/grup/kullanım-alanı adları) bilinçli TR kalır. Not: home `searchParams` kullandığından **dynamic**; build+typecheck+parity ile doğrulandı. Doğrulama: typecheck + build + 13 test + key parity 347.
- **✅ BATCH: `urunler` + `ham-madde-sertifikalari` + `sepet` (2026-07-08)** — üç sayfa + MaterialCertificateCard + InquiryCartPageClient. `public.products` + `public.materials` + `public.cart` (48 key). urunler'in hardcoded `.com.tr` canonical'ı düzeltildi; ham-madde + sepet'e metadata yoktu → eklendi (sepet `robots: noindex`). Sertifika alt-başlığı ICU `{number}`, sepet ürün sayısı ICU plural (`{count, plural, ...}`). Üçü de **SSG**. **Faz 3 sınır notu:** cart formu `webRequestFormSchema`'yı server action ([submitWebRequestAction](packages/frontend/features/public/cart/actions/submitWebRequestAction.ts)) ile paylaşıyor; şemadaki 4 TR validation mesajı client+server ortak olduğu için factory'ye çevrilmedi — backend mesaj lokalizasyonu (Faz 3) ile birlikte ele alınacak. Doğrulama: typecheck + build (3 SSG) + 6 sayfa-locale + 13 test + parity 381.
- **Faz 1b — public tamamlandı** 🎉
- **🔄 auth ekranları — Unit 1 ✅ (2026-07-08):** `auth.*` namespace (89 key). **Paylaşılan hata kataloğu:** 20 auth error kodu `auth.errors.<code>.{title,description}` kataloğuna taşındı; `lib/errors.ts` `getAuthErrorMessage` → `resolveAuthErrorKey` (key indirger, çeviri bileşende). Bu, **6 auth client'ının tamamında** hata mesajlarını hemen locale-aware yaptı. Tam çevrilen: AuthShell, SignIn, SignUp (+ signIn/signUp schema factory; server'ın kullandığı `signUpRequestSchema` TR bırakıldı = Faz 3). signin/signup page.tsx locale-aware `generateMetadata` shell prop'ları. **Kısmi (yalnız hata satırı) — kendi ünitelerinde tamamlanacak:** ForgotPassword/ResetPassword/ConfirmSignUp/AuthErrorPanel. **Kalan auth üniteleri:** ~~Unit 2~~, Unit 3 = statik durum sayfaları. Doğrulama: typecheck + build + 13 test + parity 470.
- **🔄 auth — Unit 2 ✅ (2026-07-08):** confirm/forgot/reset flow'ları tam çevrildi (`auth.forgotPassword`/`resetPassword`/`confirmSignUp` + validation, +56 key → 526). 3 client + 3 page.tsx (shell prop'ları locale-aware `getTranslations`). Schema deseni: `forgotPasswordSchema`/`confirmSignUpSchema` **hem client hem server route** kullandığı için server base'leri TR bırakıldı (Faz 3), client için `buildXSchema(t)` factory'leri eklendi (`resetPasswordRequestSchema` server-only base + `buildResetPasswordSchema` client). Tüm auth iç linkleri `@/i18n/navigation`. **Kalan auth ünitesi:** ~~Unit 3~~.
- **✅ auth — Unit 3 ✅ — AUTH TAMAMLANDI (2026-07-08):** awaiting-approval + unauthorized + signout + error sayfaları (`auth.awaiting`/`unauthorized`/`signOut`/`errorPage` + shell prop'ları, +28 key → 554). `emailNotice` rich (bold email). signout **SSG**. Küçük TR düzeltmeleri: "Vazgec"→"Vazgeç", "Giris Sayfasina Don"→"Giriş Sayfasına Dön". **AccountStatusPageClient bilinçli hariç:** yalnız `/hesabim` (panel, `(panels)` TR-only) kullanıyor → Faz 2 kapsamı. Doğrulama: typecheck + build + 13 test + parity 554.
- Kalan Faz 1b yüzeyi: dinamik ürün/kategori sayfaları (`urun/[slug]`, `urun-kategori/[slug]`, `urunler/filtre` — DB içeriği çevrilmez, sadece chrome/etiket) + CustomerLeadDialog + dil değiştirici UI (en son).

### Faz 1 uygulama sırası (her adım bağımsız doğrulanabilir)
1. `next-intl` kurulumu + `messages/tr.json` (mevcut metinler) + `middleware.ts` + `[locale]` taşıma — **davranış değişikliği sıfır**, tüm site hâlâ TR.
2. `html lang`, root metadata ve provider'ların locale-aware hale gelmesi.
3. `(public)` sayfa sayfa: string'ler `tr.json`'a, `en.json` çevirileri, sayfa başına PR.
4. Auth ekranları + zod mesajları (auth şemalarındaki TR mesajlar message catalog'dan beslenir).
5. SEO katmanı: hreflang, `sitemap.ts`, `robots.ts`, locale-aware `generateMetadata`.
6. Dil değiştirici UI (public navbar) — en son, her şey çalışırken.

## Skill Önerileri

| İhtiyaç | Durum |
|---|---|
| PR/branch denetimi | Hazır: `/code-review` (her P0-P1 PR'ında), `/security-review` (güvenlik dokunuşlarında). `/code-review ultra` yalnız kullanıcı tetikler (bulut, faturalı). |
| Değişiklik doğrulama | Hazır: `verify` skill — büyük yapısal değişiklik sonrası uçtan uca akış sürme |
| i18n göçü | **✅ Kuruldu ve kullanılıyor**: [.claude/skills/i18n-migrate](.claude/skills/i18n-migrate/SKILL.md) — `hakkimizda` pilotu bu skill'le yapıldı; kalan Faz 1b yüzeyi aynı reçeteyle seri ilerliyor. |
| Validator tamamlama | **✅ Kuruldu, P1.2'de kullanılacak**: [.claude/skills/add-response-validator](.claude/skills/add-response-validator/SKILL.md) — 9 dosyalık backlog skill içinde referanslı. |
| Yeni endpoint | Opsiyonel: AGENTS/ARCHITECTURE'daki endpoint ekleme adımları zaten net; skill'e dönüştürmek düşük öncelik. |
| UI/UX redesign taste | **✅ Kuruldu**: `Leonxlnx/taste-skill` (`npx skills add`) → `.agents/skills/*` (13 skill), `.claude/skills/` symlink. Homepage pilotu `redesign-existing-projects` ile yapıldı. |

### Taste-skill kurulumu + homepage UI pilotu (2026-07-24)

**Ne yapıldı:** `npx skills add Leonxlnx/taste-skill` ile 13 skill kuruldu (`.agents/skills/`, Claude Code'a symlink). `redesign-existing-projects` skill'inin audit-first yöntemiyle homepage (`app/[locale]/(public)/page.tsx` + `layout.tsx` + `components/home/*`) tarandı; ilk dilim "hatalar + üst section (Hero/About/Services) polish" olarak uygulandı.

**Düzeltilen gerçek hatalar:**
- `globals.css`: `--font-sans` tanımsız `var(--font-inter)`'a bağlıydı → gövde fontu (Geist) hiç uygulanmıyordu; `var(--font-geist-sans)`'e çevrildi (global etki), `--font-mono` da geist-mono fallback'ine bağlandı.
- `HeroSection`: hero görseli favicon (`/favicon-5312.png`) idi → gerçek `/logos/ceyhunlar-hero.jpg`; `framer-motion` importu (package.json'da yok, transitive) → `motion/react`; `sizes` eklendi; ölü Unsplash kodu silindi.
- `ServicesSection`: `lg-grid-cols-2` yazım hatası (grid lg'de hiç 2 sütun olmuyordu) → `lg:grid-cols-2`; çelişen `animate`+`whileInView` temizlendi.
- `AboutSection`: geçersiz `text-l` sınıfları → geçerli boyutlar; eyebrow(`<p>`)+`<h2>` semantik hiyerarşi.
- `page.tsx`: layout'taki `<main>` içinde iç içe ikinci `<main>` (çift landmark) → `<div>`; ölü yorum kodu silindi.

**Polish:** başlıklarda `text-balance`/`text-pretty`, tutarlı eyebrow+heading deseni, section dikey ritmi, Services sol kolonda `lg:sticky`.

**Nasıl doğrulandı:** `npm run typecheck -w frontend` (temiz), `npm run lint -w frontend` (0 error, 119 warning — hepsi mevcut/tolere edilen), `npm run test -w frontend` (16/16). i18n kataloglarına dokunulmadı (yalnız markup/className).

**Kalan / kullanıcıda bekleyen:** kubi'de görsel doğrulama (aşağıdaki adımlar); commit/push kullanıcıda. Not: `images.unoptimized: true` olduğu için `/logos/ceyhunlar-hero.jpg` doğrudan servis edilir, `/_next/image` regresyonundan (memory) etkilenmez. Alt section'lar (Products/Quality/Process/Enviroment) bu dilimde kapsam dışı → 2. dilimde ele alındı.

### Homepage 2. dilim — alt section polish (2026-07-24)

**Kapsam:** ana sayfanın kalan section'ları (Products / Quality / Process / Enviroment) + Quality'nin alt bileşeni ProductHighlights. Footer/Navbar (layout ortak chrome) ve koyu-görselli editorial ritim bilerek dışarıda bırakıldı.

**Düzeltilen gerçek hatalar:**
- `QualitySection`: `AnimatedSection`(=`motion.section`) > `section` > ProductHighlights(`section`) üçlü iç içe `<section>` → iç ikisi `<div>` yapıldı; hardcoded `text-gray-900/600` + `via-gray-200` → tema token'ları (`text-foreground`/`text-muted-foreground`/`via-border`).
- `ProductHighlights`: `<section>`→`<div>`; hardcoded griler → token; ikonlar tek-accent (`text-brand`) + ince hover.
- `ProcessAndContactSection`: kullanılmayan `catch (error)` → `catch {` (lint warning giderildi).
- `Enviroment`: fullScreen dalında `100vh` → `100dvh` (iOS Safari viewport zıplaması).

**Polish:** `ProductsMarquee`'ye yükleme/boş **skeleton** (kategoriler gelene kadar boş şerit yerine `animate-pulse` kartlar); başlıklarda `text-balance`/`text-pretty`; Process eyebrow'u About/Services ile tutarlı (`uppercase tracking-[0.18em]`).

**Nasıl doğrulandı:** typecheck ✅ · lint ✅ 0 error (119→118, Process `catch` uyarısı gitti) · test ✅ 16/16. i18n kataloglarına dokunulmadı. TS narrowing tuzağı (`isEmpty` ara boolean `categories`'i daraltmaz) optional chaining ile çözüldü.

## Ana sayfa performansı (teşhis + Dalga 1, 2026-07-25)

**Teşhis (canlı prod ölçümü, `page-performance` skill):** `curl https://ceyhunlarplastik.xyz/`
→ TTFB soğukta **5.0s**, warm 0.75s; HTML **1.66MB**; `cache-control: no-store` +
`x-cache: Miss from cloudfront`. Kök nedenler: (KN-1) ana sayfa `searchParams` yüzünden
**dynamic** → CDN'de cache yok, her istek cold-start riskli SSR; (KN-2) over-fetch (kategori
`limit=500` tam ağaç + tüm attribute×value×translations×assets) RSC flight'a serialize →
1.66MB; (KN-3) kategori çift-fetch (server + client); (KN-4) NavbarServer waterfall; (KN-5)
public'te `/api/auth/session` round-trip; (KN-6) ölü kod + eager dialog; (KN-8) fazla font weight.
Kararlar plan dosyasında (`~/.claude/plans/imperative-churning-pretzel.md`).

**Dalga 1 uygulandı (frontend, kod-complete):**
- **KN-1:** `page.tsx` `searchParams` kaldırıldı → `params` + `setRequestLocale` + `export const revalidate = 60` (ISR). `HomeToasts` error'u `window.location`'dan client'ta okur. → ana sayfa static/ISR olmalı (CDN cache, cold-start bypass).
- **KN-3:** `useCategories(initialData)` eklendi; `page.tsx` server kategorilerini `ProductsSection`'a `initialCategories` prop'u ile geçiyor → client'taki ikinci `/categories?limit=500` fetch'i gitmez.
- **KN-4:** `NavbarServer` `Promise.all` (waterfall kesildi).
- **KN-6 (kısmi):** ölü `ProductAssistant.tsx` (743 satır) silindi.
- **KN-8:** Montserrat weight `[400-800]` → `["300","800"]` (gerçek kullanım; 300 latent-bug'ı da düzeltir).

**Bilinçli ertelenenler (uygulama sırasında risk/fayda yeniden değerlendirildi):**
- **KN-5 (SessionProvider):** basit "kaldır" DEĞİL — `SessionProvider` paylaşılan `[locale]/layout.tsx`'te ve `/urun/[slug]` (`ProductVariantTable`) session'a ihtiyaç duyuyor. Session fetch'i non-blocking (ilk boyayı geciktirmez). Güvenli çözüm SessionProvider'ı yalnız tüketen route'lara scope etmek → ayrı, dikkatli dilim.
- **KN-6 CustomerLeadDialog dynamic:** ana sayfada `ProcessAndContactSection` zaten react-hook-form+zod yüklüyor → dialog'u dynamic yapmak ana sayfa bundle'ını anlamlı küçültmez; ayrıca her zaman görünür tetikleyici butonu ssr:false yapmak layout-shift yaratır (component split gerektirir). Ayrı bundle-optimizasyon dilimi.
- **ProductAssistantModal auto-open:** `useState(true)` ile her ana sayfa ziyaretinde otomatik açılıyor (UX kararı, hata değil). Auto-open kaldırılırsa modal `next/dynamic` ile ertelenebilir (gerçek bundle kazancı) — UX kararı kullanıcıda.

**Doğrulama:** typecheck ✅ · lint ✅ 0 error (118→117) · `next build` → **Compiled successfully in 8.4s** + TypeScript OK ("Collecting page data"daki SST-links hatası beklenen, kod-dışı). **Kalan (kullanıcıda):** static/ISR'i kanıtlamak için `sst shell -- next build` route tablosunda ana sayfa `○/●` (dynamic `ƒ` değil); deploy sonrası `curl -w` ile `x-cache: Hit` + HTML boyutu düşüşü.

**Hotfix (Footer hydration mismatch):** Dalga 1'in `ProductsSection` initialData'sı `["categories",locale]` cache'ini client'ta doldurunca, aynı key'i `initialData`'sız kullanan `Footer` (`useCategories()`) server (data yok) ↔ client (data var) uyuşmazlığı verdi. Çözüm: `(public)/layout.tsx` kategorileri server'da çekip `Footer`'a prop geçiyor; `Footer` client hook'u bıraktı → server/client aynı render + Footer'ın ekstra client fetch'i de gitti. (Kullanılmayan `components/Footer.tsx` ölü kopyası dokunulmadan bırakıldı.)

**Dalga 2 uygulandı — attributes payload slim (asıl 1.66MB kaynağı):**
Ölçüm (canlı API): `/product-attributes/with-values` = **1246 KB** (9 code, 1087 value, 2192 translation); `/categories` = yalnız 40KB (dokunulmadı). Ana sayfa asistanı + navbar numune-talep dialog'u yalnız 3 code (sector/production_group/usage_area) + value başına id/name/slug/parentValueId + PRIMARY asset kullanıyor.
- **Regresyon kontrolü:** `getAttributesForFilter` PAYLAŞILAN — `urunler/filtre`, `urun-kategori/[slug]`, admin/satış/müşteri defined-products sayfaları 6 product-filter code'unu tam haliyle kullanıyor. Bu yüzden o fn'e DOKUNULMADI.
- **Çözüm:** yeni `getAssistantAttributes(locale)` slim fn (`server/getAttributesForFilter.ts`) — full (cache'li) sonucu yeniden kullanır (ilave endpoint fetch'i yok), 3 code + slim value + PRIMARY asset'e indirger. Slim tip `ProductAttributeFilter`/`ProductAttributeFilterValue` (`types.ts`). Tüketiciler (`page.tsx` modal, `NavbarServer`→`NavbarClient`→`CustomerLeadDialog`+`MobileMenu`) slim tipe geçti; backend/validator'a dokunulmadı (tuzak yok).
- **Kazanç (gerçek veri ölçümü):** attributes flight payload **1246 KB → 329 KB = %73.6 küçülme** (her public sayfanın navbar'ında). Kalan 329KB'nin çoğu `usage_area`'nın 805 value'su + görselleri (asistanın gerçekten gösterdiği veri). **Olası Dalga 2b:** usage_area'yı asistan adımında lazy client-fetch → ilk HTML'den çıkar.

**Dalga 2 doğrulama:** typecheck ✅ (slim tip tüm tüketicilerden temiz geçti) · lint ✅ 0 error (115) · `next build` → Compiled successfully · test ✅ 16/16. Kalan (kullanıcıda): kubi'de asistan + numune-talep dialog + filtre/kategori sayfalarının (full attributes hâlâ çalışıyor) elle testi; deploy sonrası HTML boyutu düşüşü ölçümü.

**Dalga 2b uygulandı — usage_area lazy (kalan 329KB'nin çoğu):**
Slim payload'un %90'ı `usage_area`'nın 805 value'su + görselleriydi. Asistan/dialog bunu yalnız kendi usage adımında kullanıyor → ilk HTML'den çıkarıldı, lazy client-fetch'e alındı.
- `getAssistantAttributes` artık yalnız **sector + production_group** döndürür (SSR eager = **26.3 KB**).
- Yeni `getUsageAreaValues(locale)` + BFF route handler `app/api/assistant/usage-areas/route.ts` (full cache'i yeniden kullanır, `Cache-Control: s-maxage=60`) + client hook `useUsageAreaValues(enabled)`.
- `ProductAssistantModal` (`enabled = open && step>=1` — otomatik açıldığı için karşılamayı kapatana çekmez) ve `CustomerLeadDialog` (`enabled = open`) usage_area'yı lazy alır. Ortak `toSlimValues` helper.
- **Sonuç (ölçüm):** attributes ilk-HTML payload'u **1246 KB → 329 KB → 26.3 KB (~%98 azalma)**. usage_area'nın 302KB'si yalnız kullanıcı asistan/dialog akışına girince client'ta (CDN-cache'lenebilir BFF'ten) iner.
- **Doğrulama:** typecheck ✅ · lint ✅ 0 error (115) · `next build` → Compiled successfully · test ✅ 16/16.
- **Kalan (kullanıcıda):** kubi'de asistan usage adımı + numune-talep dialog usage adımının veriyi lazy yükleyip doğru gösterdiği; step>=1 gate'inin akışı bozmadığı elle test. Deploy sonrası ilk HTML boyutu (1.66MB'den) ölçümü.

### Dalga 3 — infra cold start (ERTELENDİ, 2026-07-25 kararı)

**Durum: UYGULANMADI.** Wave 1 (ana sayfa static/ISR → CDN) cold-start'ı ana sayfada zaten büyük ölçüde çözdüğü için düşük öncelik. Kullanıcı kararı: arm64+memory+`warm:1` mantıklı ama **şimdilik yapılmayacak**; **provisioned concurrency pahalı, bugün için yok**. İleride yapmak istenirse hazır reçete:

- **`infra/frontend.ts`** — yorumlu `server` bloğunu aç + arm64 + prod-only warm:
  ```ts
  server: { memory: "2048 MB", timeout: "30 seconds", architecture: "arm64" },
  warm: $app.stage === "prod" ? 1 : 0,
  ```
- **`infra/PublicApi.ts`** — `defaultOptions`'a ekle: `architecture: 'arm64'`, `memory: '1536 MB'` (tüm public route'lara uygulanır).
- **⚠️ arm64 ön-koşulu:** Public API + frontend server Prisma kullanıyor. Şema `generator client { provider = "prisma-client" }` (yeni generator) + `PrismaPg` driver adapter → native query-engine binary YOK, yani arm64 uyumlu OLMALI. Yine de **önce kubi'de deploy edip DB sorgularını doğrula**, sonra prod. `npx sst diff --stage prod` (READ-ONLY) ile prod diff'ini önden göster.
- **Maliyet:** arm64 ~%20 ucuz (invocation), memory pay-per-use, warm ≈ ~$0.2/ay → net ek ~$1-2/ay altı. Provisioned concurrency (yapılmıyor) referans: 1'er birim ~$30-38/ay, gerçek eşzamanlılık için $75-115/ay.
- **warm yalnız frontend Nextjs'te** (API'ye warm ApiGatewayV2'de route-başına kurulum ister, kapsam dışı).

## Kategori sayfası performansı (urun-kategori/[slug], 2026-07-25)

**Teşhis (canlı prod):** `curl .../urun-kategori/profil-tapalari` → TTFB 0.5–1.4s, HTML **1.64MB**,
`cache-control: no-store` + `x-cache: Miss` → `export const revalidate = 60` yazmasına rağmen sayfa
**dynamic** (ana sayfa Wave 1 sonrası ISR olmuştu; buradaki fark aşağıda).
- **KN-1 (dynamic sebebi):** `ProductFilterSidebar` `useSearchParams()` kullanıyor ve `page.tsx`'te
  Suspense yoktu → Suspense'siz useSearchParams tüm route'u static'ten düşürür → no-store, CDN cache yok.
- **KN-2 (1.64MB):** sidebar'a full `getAttributesForFilter` (1.28MB: 9 code + 2192 translation + tüm
  value'lar) geçiliyordu; sidebar bunları client'ta filtreliyor ama tüm ağaç HTML'e serialize oluyordu.

**Uygulandı (KN-1 + KN-2):**
- **KN-1:** `ProductFilterSidebar` ve `ProductFilterList` `<Suspense>`'e sarıldı (page.tsx) → useSearchParams
  bailout izole edildi, sayfa tekrar ISR/CDN-cache'lenebilir olmalı.
- **KN-2:** yeni `slimCategoryFilterAttributes(attributes, category.allowedAttributeValueIds)` util —
  translations atar (sidebar kullanmıyor) + non-industrial value'ları kategorinin allowedValueIds'ine
  göre ön-filtreler (sidebar'ın kendi mantığıyla birebir → davranış değişmez). Industrial değerler
  korunur (sidebar kategori sayfasında gösteriyor).
- **Ölçüm:** attributes payload **1246 KB → 738 KB (~%41)** (profil-tapalari, 22 allowedValueId).
  `/urunler/filtre` (paylaşılan bileşen, kategori yok) full attributes ile çalışmaya devam eder — dokunulmadı.

**Doğrulama:** typecheck ✅ · lint ✅ 0 error (115) · `next build` → Compiled successfully.
**Kalan (kullanıcıda):** deploy sonrası `curl` ile `no-store → s-maxage` (ISR) + HTML boyutu düşüşü;
kubi'de kategori sayfası + `/urunler/filtre` filtrelerinin çalıştığı elle test.
**Olası devam:** kalan 738KB'nin ~302KB'si `usage_area`'nın 805 industrial value'su — kategori sayfasında
industrial filtreleri gizlemek (`hideIndustrialFiltersWhenCategorySelected`) ya da lazy yüklemek (homepage
Wave 2b deseni) bunu da keser. UX kararı gerektirir.

**KN-3 uygulandı — ProductFilterList ürünleri SSR/ISR'e alındı (2026-07-25):**
Kabuk hızlandıktan sonra kalan yavaşlık: `ProductFilterList` ürünleri client'ta `useProducts` ile çekiyordu
(SSR yok) → hydrate→store-sync→fetch→render waterfall'u. Ölçüm: `/products?category=...&page=1&limit=20` =
115KB, TTFB **warm ~0.25-0.8s, cold ~3.46s** (public API Lambda VPC cold-start), CDN cache header'ı yok →
her client fetch Lambda'ya. Payload zaten card-view slim (backend `listProducts(..., {view:"card"})` kullanıyor).
- **Çözüm (skill P4 — RSC-first + initialData):** yeni `getCategoryProducts(slug, locale)` server fn
  (`features/public/products/server/`, unstable_cache 60sn) filtresiz ilk sayfayı (page 1, limit 20) server'da
  çeker; `page.tsx` `Promise.all`'a eklendi, `ProductFilterList`'e `initialProducts` prop'u geçilir.
  `useProducts` `initialData` alır. **Guard:** initialData YALNIZ filtresiz varsayılan görünümde uygulanır
  (`isDefaultView = page===1 && !search && !attrFilters`) → filtre/sayfa değişince yeni query key'e yanlış seed olmaz.
  `ProductListPayload` tipi `products/types.ts`'e taşındı (client'ın server dosyasından import etmemesi için).
- **Sonuç:** kategori sayfasına filtresiz girişte ürünler ISR/CDN-cache'li HTML'de gelir → client fetch yok,
  cold-start (3.46s) kullanıcıya değil ISR üretimine (60sn'de bir) yansır. Filtre uygulanınca client fetch devam eder.
- **Doğrulama:** typecheck ✅ · lint ✅ 0 error (116) · `next build` → Compiled successfully.
- **Kalan (kullanıcıda):** deploy sonrası kategori sayfasına filtresiz girişte ürünlerin spinner'sız geldiği +
  filtre uygulayınca client fetch'in çalıştığı elle test.

## Görsel ağırlığı — asıl darboğaz (2026-07-25)

Wave 1+2+2b deploy edildikten SONRA canlı ana sayfa ölçümü: TTFB **0.05s** (`x-cache: Hit from
cloudfront`, ISR çalışıyor ✅), HTML **391KB** (1.66MB'den). Buna rağmen sayfa "yavaş" hissettiriyordu.
Sebep sunucu değil, **tek bir görsel**:

| Kaynak | Boyut | Pay |
|---|---|---|
| **/logos/nature.jpg** | **5747 KB** | **%87** |
| JS (29 chunk, sıkıştırılmış) | 473 KB | %7 |
| HTML | 391 KB | %6 |
| CSS | 29 KB | %0.4 |

**Kök neden:** `Enviroment.tsx` görseli **CSS `background-image`** olarak kullanıyordu → `next/image`
optimizasyonu (WebP/AVIF + cihaz genişliği + lazy-load) tamamen bypass ediliyor, ham dosya iniyordu.
Kaynak dosya ayrıca absürt boyuttaydı: **12111×3530 px / 5.48MB** (üstünde `bg-black/45` overlay olan
dekoratif bir arka plan için).

**Uygulandı:**
1. Kaynak `public/logos/nature.jpg` yeniden boyutlandırıldı: 12111×3530 / 5.48MB → **2560×746 / 315KB**
   (sharp, q80 mozjpeg progressive) = **%94.4 küçülme**. Tam-genişlik dekoratif arka plan için 2560px fazlasıyla yeterli.
2. `Enviroment.tsx` CSS background → `next/image` (`fill`, `sizes="100vw"`, `quality={70}`, alt=""+aria-hidden,
   fold altında olduğu için lazy). Artık Next WebP/AVIF'e çevirip cihaz genişliğine göre servis eder → beklenen ~80-150KB.
   Bu component `/surdurulebilirlik` sayfasında da kullanılıyor, oraya da yarıyor.

**Beklenen etki:** ana sayfa toplam ağırlığı **~6.6MB → ~1.0MB (~%85 azalma)**.

**Repo geneli tarama:** başka `next/image` bypass eden CSS background yok. Kalan tek dosya-referanslı
CSS background `ProcessAndContactSection` → `hakkimizda.jpg` (64KB, `background-attachment: fixed`
parallax efekti için — kabul edilebilir, dokunulmadı). Diğer büyük `public/` görselleri (`machining-1.png`
1MB, `metal.png` 983KB vb.) `next/image` üzerinden servis edildikleri için optimize ediliyor; yalnızca
Next optimizer'ın işlemesi pahalı → istenirse kaynakları da küçültülebilir (düşük öncelik).

**Sıradaki fırsat (yapılmadı):** JS 473KB / 29 chunk. `CustomerLeadDialog` (696 satır +
react-hook-form + zod + resolvers) navbar üzerinden HER public sayfada kapalıyken bile bundle'da;
`ProductAssistantModal` de eager. Tetikleyici butonu statik bırakıp dialog içeriğini `next/dynamic`'e
almak gerçek kazanç sağlar ama component split gerektirir → ayrı dilim.

## Sayfa geçişi UX + navigasyon algılanan hızı (2026-07-25)

**Belirti:** Ana sayfadan bir kategoriye tıklayınca "sayfa geç yükleniyor" hissi.

**Ölçüm (canlı, henüz ESKİ kod deploy'da):** normal yükleme TTFB 0.5-1.7s / HTML 1.29MB;
`cache-control: no-store` + `x-cache: Miss` (ISR düzeltmesi henüz deploy edilmedi).
**Link tıklaması = RSC navigation payload: ~1.0 MB** (her tıklamada yeniden iniyor).

**Kök neden (algılanan yavaşlık):** public ağaçta **hiç `loading.tsx` yoktu**. App Router,
RSC yanıtı gelene kadar kullanıcıyı ESKİ sayfada hiçbir geri bildirim vermeden bekletir →
tıklama "hiçbir şey olmadı" hissi verir; 400ms bile bozuk gibi hissettirir.

**Uygulandı:**
- `app/[locale]/(public)/urun-kategori/[slug]/loading.tsx` — gerçek layout'a birebir oturan
  iskelet (PageHero yükseklikleri + `max-w-7xl px-6 py-12 grid-cols-12 gap-8` + 3/9 kolon +
  12'li ürün grid'i) → tıklama anında görünür, içerik gelince layout shift YOK.
- `app/[locale]/(public)/loading.tsx` — diğer tüm public rotalar için genel iskelet.
- `app/[locale]/(public)/template.tsx` — **sayfa geçiş animasyonu** (motion/react, opacity+8px
  y, 0.25s, `useReducedMotion` destekli). `template.tsx` her navigasyonda remount olduğu için
  App Router'da geçiş animasyonunun idiomatik yeri; Navbar/Footer layout'ta kaldığından
  yeniden animasyona girmez. `(auth)` altındaki mevcut template deseni takip edildi.
  Not: App Router template'i AnimatePresence ile sarılmadığı için `exit` çalışmaz — eklenmedi.
  Süre bilerek kısa (0.25s): uzunu, sayfa hazırken gecikme hissi yaratır.

**Doğrulama:** typecheck ✅ · lint ✅ 0 error (116) · `next build` → Compiled successfully.

**Eksik kalan parça — global navigasyon göstergesi (eklendi):**
`template.tsx` yeni sayfa MOUNT olduğunda çalışır (bekleme BİTTİKTEN sonra), `loading.tsx`
iskeleti ise yalnız içerik alanında çıkar. Kullanıcı kategoriyi navbar'ın **tam-ekran
mega-dropdown'ından** seçtiği için iskelet dropdown'ın ARKASINDA kalıyordu → "tıkladım,
hiçbir şey olmadı" hissi devam ediyordu.
- Yeni `components/navigation/NavigationProgress.tsx` + `(public)/layout.tsx`'e bağlandı:
  tıklama anında üstte ince ilerleme çubuğu + "Sayfa yükleniyor" rozeti, **z-[60]** ile
  navbar (z-50) ve dropdown'ın ÜSTÜNDE. AGENTS.md gereği tam ekranı bloklayan spinner YOK.
- i18n: `chrome.navigationProgress.label` (tr/en, 832=832 dengeli).
- Teknik notlar: (a) `useSearchParams()` KULLANILMADI — layout'ta olduğu için tüm public
  ağacı dynamic'e düşürürdü (bu oturumda öğrenilen tuzak); `usePathname` static'i bozmaz.
  (b) Gösterge durumu `navFrom === pathname` ile **türetildi**; effect içinde senkron
  setState cascading render'a yol açıyor ve lint error veriyordu. (c) Navigasyon iptal
  edilirse takılı kalmasın diye 10sn güvenlik zamanlayıcısı.
- Akış artık: tıklama → gösterge (anında, her yerden görünür) → `loading.tsx` iskeleti →
  yeni sayfa → `template.tsx` ile yumuşak giriş.

**UYGULANDI — industrial filtreler lazy (2026-07-25):**
Kategori sayfasındaki slim attributes payload'unun **%98.8'i (726KB / 920 value)** varsayılan
olarak **KAPALI** bir popover (`ProductFilterPopoverSelect`) içindeki industrial filtrelerdi
(sector+production_group+usage_area). Görünür ürün filtreleri yalnız 9KB.
- **P9 deseni** (ana sayfadaki `usage-areas` BFF'iyle aynı): yeni
  `getIndustrialFilterAttributes` server fn + `app/api/product-filters/industrial/route.ts`
  (full cache'i yeniden kullanır, `s-maxage=60`) + `useIndustrialFilterAttributes(enabled)` hook.
- `ProductFilterSidebar`'a **opt-in** `lazyIndustrialAttributes` prop'u eklendi; yalnız
  kategori sayfası gönderiyor. **`/urunler/filtre` GÖNDERMEZ** (orada industrial filtreler
  birincil) → grep'le doğrulandı, tam attributes ile çalışmaya devam eder.
- `slimCategoryFilterAttributes`'a `{ excludeIndustrial }` seçeneği eklendi.
- **Ekstra kazanç:** sidebar attribute değerlerinde `assets` KULLANMIYOR (assets yalnız
  kategori önizlemesinde) → lazy yanıt yalnız `id/name/slug/parentValueId` taşır.

**Ölçüm:** SSR attributes payload **741KB → 13KB (%98.3)**. Lazy BFF yanıtı **147KB**
(726KB değil — assets/timestamps atıldı), CDN-cache'li ve React Query ile kategoriler arası
paylaşımlı → kritik yolun dışında, tekrar inmez.

**Doğrulama:** frontend typecheck ✅ · lint ✅ 0 error (116) · `next build` → Compiled
successfully ✅ · frontend 16/16 ✅ · core 149/149 ✅ · i18n 832=832 ✅.
**Kalan (kullanıcıda):** kubi'de kategori sayfasında endüstriyel kullanım popover'ının
değerleri yüklediği; REGRESYON: `/urunler/filtre` endüstriyel filtrelerinin eskisi gibi
çalıştığı elle test.
**Olası devam:** lazy fetch şu an mount'ta tetikleniyor (görünürse). Popover açılışına
bağlamak 147KB'yi de ilk yükten çıkarır ama `ProductFilterPopoverSelect`'e wiring gerektirir.

## Ürün liste payload'ı — kart DTO'su (2026-07-25)

**Soru:** kategori sayfasında ürünler listelenirken gelen veri ne kadar gerekli?

**Ölçüm (`/products?category=profil-tapalari&page=1&limit=20`, 113KB / 20 ürün):**

| Alan | Boyut | Pay | ProductCard kullanıyor mu? |
|---|---|---|---|
| attributeValues | 55.9KB | %49.6 | Yalnız `id,name,attribute.code/name` (ilk 4'ü) |
| category | 31.0KB | %27.5 | **Hayır** — zaten kategori sayfasındayız, 20 kez tekrar |
| assets | 9.0KB | %7.9 | Yalnız `role/type/url` |
| translations | 5.8KB | %5.1 | **Hayır** (API zaten locale çözüyor) |

**Kök neden:** `attributeValuesInclude` 3 seviye ÖZYİNELEMELİ (attribute + translations +
parentValue → tekrar attribute + translations + parentValue…). Ayrıca `listCardInclude`
her ürüne tam `category` ekliyor.
**Sayfalama sorunu YOK:** `meta.total=76` iken yalnız 20 ürün geliyor; sorun ürün sayısı
değil, ürün başına 5.6KB şişkinlik.

**Uygulandı (iki dilim):**
1. **Frontend slim** — `features/public/products/utils/slimProductCards.ts`, `getCategoryProducts`
   içinde kullanılır. `Product`'ın ZORUNLU alanları (categoryId/createdAt/updatedAt ≈1.7KB)
   korunur, ağır opsiyoneller atılır → dönüş tipi `Product[]` kalır, `useProducts`'ın diğer
   6 tüketicisi etkilenmez. SSR/RSC payload'ını backend deploy'undan bağımsız küçültür.
2. **Backend kart DTO'su (`?view=card`)** — `listProductsHandler.toProductCardDTO`.
   - **OPT-IN olmak ZORUNDA:** aynı public endpoint'i müşteri portalı + admin özel-fiyat/varyant
     ekranları da kullanıyor ve **3'ü `product.category` okuyor** (grep'le doğrulandı) →
     koşulsuz daraltma onları bozardı. `view=card` yalnız `getCategoryProducts` ve
     `ProductFilterList`'ten gönderilir.
   - **Repository include'u DEĞİŞTİRİLMEDİ:** `mapProductWithAssets` lokalizasyon ve
     sector/production_group hiyerarşisi için translations + derin parentValue zincirini
     kullanıyor. Daraltma map'ten SONRA yanıt seviyesinde yapılır.
   - **Tuzak (yakalandı):** `view` parametresi attribute-filtre dışlama listesine eklendi;
     eklenmeseydi attribute filtresi sanılıp sorgu sonucunu bozacaktı.
   - **Validator:** `productSchema` `category/categoryId/timestamps`'i, `assetSchema` `key/mimeType`'ı,
     `attributeValueSchema` `attributeId/displayOrder/isActive`'i ZORUNLU tutuyordu → liste route'una
     `productListItemSchema` + `listAssetSchema` + `listAttributeValueSchema` (her iki shape'i kabul eder).
     Tekil ürün route'ları KATI `productSchema`'da kaldı.
   - **AJV kanıtı (varsayılmadı):** geçici repo-kökü tsx script'i ile `ajv/dist/2020` →
     `card DTO: GEÇTİ ✓`, `TAM yanıt (regresyon): GEÇTİ ✓`. İlk denemede `assetSchema.key`
     zorunluluğunu yakaladı ve şema düzeltildi; script silindi.

**Kazanç:** 113KB → **~19-21KB / 20 ürün (~%83)**, ürün başına 5.6KB → 0.9KB. Hem ilk yük
(SSR/RSC) hem filtre sonrası client fetch'i kapsar.

**Doğrulama:** `typecheck:backend` ✅ · frontend typecheck ✅ · lint ✅ 0 error (116) ·
core 149/149 ✅ · functions 8/8 ✅ · frontend 16/16 ✅.
**Kalan (kullanıcıda):** kubi'de kategori sayfası kartları (görsel + attribute rozetleri) +
filtre uygulama; REGRESYON: müşteri portalı "Tüm Ürünler", admin özel fiyatlar / atanmış
varyantlar ekranları (bunlar `view` göndermez, tam yanıt almalı).

## Public filtre deneyimi — müşteri paneli mantığına hizalama (2026-07-25)

**İstek:** Public ürün listeleme sayfaları, müşteri panelindeki (`CustomerPortalAllProductsPageClient`)
`ProductFilterSidebar` mantığını kullansın. Panel dokunulmadı (yalnız referans alındı).

**Rol ayrımı netleşti:**
- `urun-kategori/[slug]` → kategori sabit; **ürün filtreleri gösterilir**, endüstriyel
  taksonomi (sector/production_group/usage_area) **gizlenir**.
- `urunler/filtre` (Sektörel Ürünler) → **yalnız endüstriyel taksonomi**; kategori seçici ve
  kategori-kapsamlı ürün filtreleri gösterilmez.

**Uygulandı:**
- Kategori sayfası panelin prop kombinasyonunu kullanıyor: `showProductFiltersOnlyWhenCategorySelected`
  + `hideIndustrialFiltersWhenCategorySelected` + `attributeSelectorVariant="popover"` +
  `showProductSearch` + `showSelectedCategoryPreview` (hepsi zaten var olan prop'lar).
- Sidebar'a yeni **opt-in** `showOnlyIndustrialFilters` prop'u → `/urunler/filtre` bu modda.
- **Layout (her iki public sayfa):** `grid-cols-12` + `col-span-3/9` → `lg:grid-cols-[320px_minmax(0,1fr)]`
  (panelin yerleşimi). **Gerçek bug düzeldi:** eski yapıda responsive kırılım yoktu, sidebar
  MOBİLDE %25 genişliğe sıkışıyordu; artık lg altında alt alta yığılıyor.
- **i18n:** sidebar'daki hardcoded "Urun Arama" / "Aramayi temizle" (public'te artık görünür
  hale geldiği için) `public.productFilter.productSearchLabel` + `clearSearch` anahtarlarına
  taşındı (tr/en, 834=834).
- `ProductCategoryFilterRail` public'te KULLANILMADI (istenmedi).

**Performansla kesişim:** kategori sayfasında endüstriyel filtreler artık gizli olduğu için
`useIndustrialFilterAttributes` `enabled` koşulu sağlanmıyor → 147KB lazy fetch o sayfada hiç
tetiklenmiyor. Server tarafındaki `excludeIndustrial: true` yine gerekli (aksi halde
render edilmeyen 726KB SSR payload'una serialize olurdu).

**Doğrulama:** typecheck ✅ · lint ✅ 0 error (116) · `next build` → Compiled successfully ✅ ·
frontend 16/16 ✅ · i18n 834=834 ✅ · müşteri paneli dosyalarına dokunulmadı (git ile doğrulandı) ✅.
**Kalan (kullanıcıda):** kubi'de iki public sayfanın filtre davranışı + mobil yerleşim;
REGRESYON: müşteri paneli "Tüm Ürünler" eskisi gibi çalışmalı.

## i18n bug — EN sayfalarda filtre/arama TR'ye düşüyordu (2026-07-25)

**Belirti:** `/en/urunler/filtre`'de arama veya usage_area seçimi kullanıcıyı TR sayfaya
yönlendiriyordu; `/en/urun-kategori/[slug]`'de arama ve filtre seçimi **404** veriyordu.

**Kök neden:** Public filtre bileşenleri locale-aware olmayan `next/navigation` `useRouter`'ını
kullanıyordu. `router.replace("/urun-kategori/{slug}?...")` `/en` önekini DÜŞÜRÜYOR:
- `/urunler/filtre` → TR sayfası (sonuçlar TR locale ile geliyor)
- kategori sayfasında EN slug + TR route → `getCategoryBySlug(enSlug, "tr")` = null → `notFound()` → **404**

**Düzeltildi** — dört bileşende `useRouter` → `@/i18n/navigation`:
`ProductFilterSidebar`, `ProductActiveFilters`, `ProductFilterPagination`, `ProductAttributeBadges`.
(`useSearchParams` next/navigation'da kaldı; next-intl karşılığı yok ve okuma amaçlı.)

**Panel regresyon riski YOK (kanıtlandı):** aynı bileşenler `(panels)` altında da kullanılıyor
(müşteri portalı, admin atanmış varyantlar). `i18n/request.ts` panel route'larında locale'i
`routing.defaultLocale` = **tr**'ye düşürüyor ve `localePrefix: "as-needed"` TR'de ön ek
EKLEMİYOR → panel yolları birebir aynı üretiliyor.

**Doğrulama:** typecheck ✅ (next-intl router API uyumlu) · lint ✅ 0 error (116) ·
`next build` → Compiled successfully ✅ · frontend 16/16 ✅.
**Kalan (kullanıcıda):** `/en/urunler/filtre` arama + sektörel seçim, `/en/urun-kategori/[slug]`
arama + filtre + sayfalama; REGRESYON: müşteri portalı "Tüm Ürünler" ve admin atanmış
varyantlar ekranlarında filtre/sayfalama URL'leri değişmemeli.

## i18n bug #2 — EN sayfada attribute filtresi hiç ürün bulamıyordu (2026-07-25)

**Belirti:** EN sayfada bir ürün özelliği seçilince "ürün yok" deniyordu, oysa ürünler var
(`/en/urun-kategori/...?profile_type=pipe-profile`). Router düzeltmesinden SONRA da sürdü.

**Kök neden:** `ProductAttributeValue.slug` VARSAYILAN locale (TR) değerini tutar; EN slug'lar
`ProductAttributeValueTranslation.slug`'ta yaşar. `productRepository.listProducts` içindeki
`buildAttributeWhere` ise **yalnız temel satırın `slug`'ına** bakıyordu (7 yerde:
sector×3, production_group×2, usage_area×1, generic×1). UI EN slug gönderdiği için eşleşme sıfır.
Ürün ARAMASI zaten çeviriye bakıyordu (`translations.some`) — bu yüzden arama çalışıp filtre çalışmıyordu.
Kategori slug'ı da locale-aware çözülüyordu (`categoryRepository.getCategoryBySlug` →
`CategoryTranslation`), bu yüzden sayfa açılıyor ama filtre boş dönüyordu.

**Canlı API ile kanıtlandı (düzeltme öncesi):**
| Sorgu | Sonuç |
|---|---|
| `locale=tr`, TR slug `boru-profil` | **33 ürün** |
| `locale=en`, EN slug `pipe-profile` | **0 ürün** ← bug |
| `locale=en`, filtresiz | 76 ürün |
| `locale=en` ama TR slug `boru-profil` zorlanınca | **33 ürün** ← veri var, eşleşme yanlıştı |

**Düzeltildi:** `products/repository.ts` içine `valueSlugMatch(slugs)` helper'ı — slug'ı hem
temel satırda hem `translations` üzerinde (`locale: { in: searchableLocales }`) arar.
7 eşleşme noktasının tamamı bunu kullanıyor. Repository'nin mevcut `searchableLocales`
deseni ([locale, DEFAULT] / [DEFAULT]) yeniden kullanıldı → cross-locale slug çakışması yok.

**Doğrulama:** `typecheck:backend` ✅ (Prisma iç içe `OR` spread'ini kabul etti) ·
core 149/149 ✅ (`products/repository.test.ts` dahil) · functions 8/8 ✅ · frontend typecheck ✅ ·
lint 0 error ✅.
**Kalan (kullanıcıda):** kubi'de EN sayfada ürün filtresi + sektörel filtreler; REGRESYON:
TR sayfada aynı filtreler eskisi gibi çalışmalı (TR slug'lar temel satırda eşleşmeye devam eder).

## Sayfalama — pencereli (windowed) hale getirildi (2026-07-25)

**Sorun:** `ProductFilterPagination` TÜM sayfaları yan yana basıyordu
(`Array.from({ length: totalPages })`). Katalog büyüdükçe onlarca buton.

**Uygulandı:**
- Saf mantık `features/public/products/utils/getPaginationItems.ts`'e alındı (repo'nun
  `utils/` konvansiyonu; test edilebilir). Desen: `1 … 4 [5] 6 … 20` — ilk/son her zaman,
  mevcut sayfa ± 1 komşu, boşluklarda "…". "…" yalnız gerçekten atlanan sayfa varsa çıkar
  (tek sayfa atlanacaksa numaranın kendisi gösterilir).
- Bileşen yeniden yazıldı: `<nav aria-label>`, prev/next `aria-label`li ikon butonlar,
  aktif sayfada `aria-current="page"`, `tabular-nums` hizalama, `isPending` sırasında
  butonlar disabled. **Mobilde** numaralar gizlenir, yerine kompakt "Sayfa X / Y" gösterilir.
- **i18n:** `paginationLabel`, `previousPage`, `nextPage`, `goToPage`, `pageOf` (tr/en, 839=839).
  Önceki hal metinsiz/erişilebilirlik etiketsizdi.
- Aynı sayfaya tıklamada gereksiz navigasyon yapılmaz (`if (target === page) return`).

**Kenar durumlar doğrulandı** (geçici script ile, sonra silindi): `total<=7` kısaltma yok;
başta `1 2 3 4 5 … 20`; ortada `1 … 9 10 11 … 20`; sonda `1 … 16 17 18 19 20`; `total=1` → null.

**Kapsam:** bileşen paylaşılan — public katalog, müşteri portalı "Tüm Ürünler" ve admin
atanmış varyantlar ekranlarının üçü de bu iyileştirmeden yararlanır (i18n namespace
panellerde de erişilebilir; oralarda locale TR-sabit).

**Doğrulama:** typecheck ✅ · lint ✅ 0 error (116) · `next build` → Compiled successfully ✅ ·
frontend 16/16 ✅ · i18n 839=839 ✅.

## Refetch geri bildirimi standardı (2026-07-25)

**İstek:** public filtre/arama sayfalarında yeniden veri çekilirken kullanıcıya süreç
gösterilsin; bu bir STANDART haline gelsin ve dokümante edilsin.

**Tespit edilen sorunlar:**
1. `ProductFilterList` refetch sırasında sayfa-seviyesi `fixed top-0 w-full h-1` bar
   gösteriyordu → hem bölüm-yerel değildi (AGENTS.md kuralına aykırı) hem de yeni global
   `NavigationProgress` çubuğuyla **aynı konumda çakışıyordu**.
2. "Sonuç yok" durumu ERKEN return ediyordu → 0 sonuç veren filtre ekranda görünmüyordu
   (kullanıcı hangi filtreyi kaldıracağını göremiyor) ve o durumda hiç geri bildirim yoktu.

**Uygulandı:**
- Yeni `features/public/products/components/ProductListLoadingOverlay.tsx`: liste kabına
  `absolute inset-0` bölüm-yerel overlay; `pointer-events-none`, `role="status"`,
  `aria-live="polite"`, `AnimatePresence` giriş/çıkış, `useReducedMotion`. Önceki içerik
  altında görünür kalır (`placeholderData: (prev) => prev` zaten vardı).
- `ProductFilterList`: `fixed` bar kaldırıldı, sarmalayıcıya `relative` + `aria-busy`,
  aktif filtre çipleri boş durumda da gösteriliyor.
- i18n `public.productFilter.updatingResults` (tr/en, 840=840).

**Standart haline getirildi (dokümantasyon):**
- **AGENTS.md** → mevcut "filter/search/sort/pagination" kuralına somut 5 maddelik
  "Established refetch-feedback pattern" eklendi (bileşen adlarıyla) + rota navigasyonunun
  AYRI bir konu olduğu (`loading.tsx` / `template.tsx` / `NavigationProgress`) yazıldı.
- **page-performance skill** → yeni `P10 — Bekleme HİSSİNİ düzelt` deseni: üç olayın üç ayrı
  mekanizması ve "bölüm refetch'i için sayfa-seviyesi fixed bar kullanma" tuzağı.

**Performans regresyon kontrolü (kullanıcı sorusu):** iki sayfadaki tüm iyileştirmeler
grep'le tek tek doğrulandı — ISR `revalidate=60`, Suspense, `getCategoryProducts` SSR +
`initialProducts`, `isDefaultView` guard, `excludeIndustrial`, `lazyIndustrialAttributes`,
`view=card`, `slimProductCards`, backend `toProductCardDTO`, `valueSlugMatch` (8 nokta).
Hepsi YERİNDE; bu dilimde yalnız görsel geri bildirim katmanı değişti.

**Doğrulama:** typecheck ✅ · lint ✅ 0 error (116) · `next build` → Compiled successfully ✅
(ilk denemede Turbopack'te geçici bir Rust panic'i oluştu, tekrar çalıştırınca geçti — kod
kaynaklı değil) · frontend 16/16 ✅ · i18n 840=840 ✅.

## Doğrulanamayan / Onay Bekleyen Noktalar

- `images.unoptimized: true` bilinçli mi? (OpenNext image optimization maliyet kararı olabilir)
- `npm audit`'teki `hono`/`mcp-sdk`/`aws-sdk` bulgularının deploy artefaktına girip girmediği
- Panel yüzeylerinin (admin/satış/portal) EN çevirisine ihtiyaç olup olmadığı (iş kararı)
- `multiAz` ve storage büyütme maliyet onayı
- Runtime'da hangi `next.config`'in yüklendiği (`.mjs` beklenir)
