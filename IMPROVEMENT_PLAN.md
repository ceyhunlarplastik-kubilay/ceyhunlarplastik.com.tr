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

**P0.2 — CORS'u stage-aware daralt** · kapsam: küçük · **✅ Uygulandı (2026-07-07, prod'a deploy bekliyor)**
- Ne: [middy.ts:101](packages/core/src/core/middy.ts) `origin: "*"` → stage'e göre domain listesi; Bearer token kullanıldığı için `credentials: true` muhtemelen gereksiz, kaldırılmalı.
- Neden: Panel API'leri herhangi bir origin'den çağrılabilir durumda. `*` + `credentials` kombinasyonu ayrıca spec'e aykırı.
- Uygulama notları: Araştırmada asıl uygulama noktasının kod değil **API Gateway** olduğu görüldü — SST `cors` verilmeyince `allowOrigins: ["*"]` default'u devredeydi ve AWS HTTP API kuralı gereği backend CORS header'ları zaten yok sayılıyordu. Çözüm: [infra/cors.ts](infra/cors.ts) (stage-aware origin tek kaynağı: prod → domain+www, dev → dev.domain, kişisel stage'ler → localhost:3000) + dört `infra/*Api.ts`'e `cors: apiCors`. Ölü/yanıltıcı kod temizlendi: middy `httpCors` kaldırıldı, [response.ts](packages/core/src/core/helpers/utils/api/response.ts) hardcoded `*` header'ları kaldırıldı, `IApiResponse` tipi güncellendi, `@middy/http-cors` bağımlılığı silindi. Kubi stage'de doğrulandı: 4 API'de `AllowOrigins: ["http://localhost:3000"]`; izinli origin preflight'ta ACAO dönüyor, yabancı origin'e CORS header'ı dönmüyor. **Prod'a yansıması bir sonraki `deploy --stage prod` ile olur** — prod origin listesi `https://{DOMAIN}` + `https://www.{DOMAIN}`.

**P0.3 — Dependency açıklarını kapat** · kapsam: orta · **✅ Uygulandı (2026-07-07, prod'a deploy bekliyor)**
- Ne: `next@16.1.6` → yamalı sürüme yükselt; `nodemailer` yükselt; kırıcı olmayan `npm audit fix`. `next-auth@4`'ün `uuid` açığı için `overrides` ile pin (v5 migration'ı P2'ye — bkz. P2.2).
- Neden: 8 high severity açık production bağımlılık zincirinde.
- Uygulama notları: `next` 16.1.6 → **16.2.10** (+`eslint-config-next`), `nodemailer` 7 → **9.0.3** (advisory fix sürümü; repo'nun kullandığı `createTransport`/`sendMail` yüzeyi değişmedi), `npm audit fix` ile `form-data`/`fast-uri`/`qs` kapandı. Production high sayısı 8 → 4. Doğrulama: frontend typecheck + 28 unit test + `sst shell --stage kubi` içinde tam `next build` başarılı.
- **Bilinçli kalan açıklar:** (a) 4 high — tamamı `sst@3.19.3` CLI zinciri (`opencontrol`/`hono`/`mcp-sdk`/`aws-sdk`); yalnız `sst dev` geliştirici makinesinde çalışır, Lambda bundle'ına girmez; fix SST 4.0.7+ → bkz. P2.6. (b) `next-auth`+`uuid` moderate — önerilen "fix" v3'e downgrade; uuid açığı `buf` parametreli v3/v5/v6 gerektirir, next-auth yalnız rastgele v4 üretir → sömürü yolu yok; kalıcı çözüm P2.2. `overrides` ile uuid pinleme auth zincirini kırma riski nedeniyle bilinçli yapılmadı. (c) `prisma`/`@prisma/dev` moderate — dev-server bileşeni; fix prisma 7.9+ ayrı yükseltme işi. (d) `vitest@2` critical — yalnız devDependency (Vitest UI server), CI/prod'a girmez; P1.4 test işiyle birlikte vitest 4'e yükseltilebilir. Bu kalıntılar nedeniyle CI audit job'u şimdilik non-blocking kalıyor (bkz. P1.7).

**P0.4 — Supplier soft-delete `findUnique` kaçağını kapat** · kapsam: küçük (ama davranış değişikliği) · **✅ Uygulandı (2026-07-07, prod'a deploy bekliyor)**
- Ne: [prisma.ts](packages/core/src/core/db/prisma.ts) supplier extension'ına `findUnique` (ve `deleteMany`) override'ı ekle — `color` ile simetrik.
- Neden: Soft-delete edilmiş supplier, `findUnique` üzerinden admin/portal yüzeylerine sızabilir.
- Uygulama notları: Envanter tek çağrı noktası buldu ([suppliers/repository.ts:87](packages/core/src/core/helpers/prisma/suppliers/repository.ts)) ve restore/reactivate akışı olmadığı doğrulandı — davranış değişikliği güvenli. Uygulamada **aynı sınıftan yeni bir bug daha bulundu ve kapatıldı**: `OrThrow` varyantları ayrı Prisma operasyonlarıdır ve override edilmemişlerdi; [colors/repository.ts:80](packages/core/src/core/helpers/prisma/colors/repository.ts) `findUniqueOrThrow` kullandığı için **silinmiş renkler de id ile okunabiliyordu**. Eklenen override'lar: supplier'a `findUnique`/`findUniqueOrThrow`/`findFirstOrThrow`/`deleteMany`, color'a `findUniqueOrThrow`/`findFirstOrThrow`. Davranış: silinmiş kayıt artık var olmayan id ile aynı yolu izler (`null` / P2025) — yeni hata modu yok. Kubi lokal DB'de 6 senaryoluk davranış scripti ile doğrulandı (6/6 PASS). Ders: soft-delete extension'ı operasyon-bazlı sayım yapar; yeni bir read operasyonu (`aggregate`, `groupBy` vb.) kullanılacaksa override kapsamı kontrol edilmeli.

**P0.5 — Prod alarmlarını bildirime bağla** · kapsam: küçük · **✅ Uygulandı (2026-07-07, prod'a deploy bekliyor)**
- Ne: SNS topic + e-posta aboneliği; [observability.ts](infra/observability.ts) alarmlarında `actionsEnabled: true` + `alarmActions`.
- Neden: Şu an prod'da Lambda concurrency tükenmesi veya frontend throttle olsa kimse haber almaz.
- Uygulama notları: `ceyhunlarweb-prod-alarms` SNS topic'i + `kubilayuysal.ceyhunlarplastik@gmail.com` e-posta aboneliği eklendi; 8 alarmın tamamında (`account concurrency` 1, frontend server 2, public ürün route'ları 6) `actionsEnabled: true` + `alarmActions` + `okActions` (düzelme bildirimi dahil). Kaynaklar yalnız prod'da yaratılır. **Prod deploy sonrası zorunlu adım:** AWS'den gelen "Subscription Confirmation" mailindeki linke tıklanmalı — tıklanmazsa bildirim gitmez ve istek 3 günde düşer. Opsiyonel uçtan uca test (deploy + onay sonrası): `aws cloudwatch set-alarm-state --alarm-name ceyhunlarweb-prod-frontend-server-lambda-throttles --state-value ALARM --state-reason "test"` → e-posta gelmeli; alarm bir sonraki değerlendirmede kendiliğinden OK'e döner ve OK maili de gelir.

**P0.6 — API route Lambda'larına aranabilir isim standardı** · kapsam: küçük kod, büyük tek-seferlik churn · **✅ Uygulandı (2026-07-07, prod'a deploy bekliyor)** *(kullanıcı talebiyle eklendi)*
- Ne: [infra/lambdaNaming.ts](infra/lambdaNaming.ts) `apiRouteLambdaNamer(boundary)` — dört API'nin `transform.route.handler`'ına bağlandı; her route Lambda'sı `{app}-{stage}-{boundary}-{klasör}-{handler}-{hash5}` formatında fiziksel isim alır (örn. `ceyhunlarweb-prod-public-products-getProductBySlug-352a8`). Log group'lar da aynı isimden türediği için CloudWatch'ta aranabilir.
- Neden hash eki: aynı handler birden fazla route'a bağlanabiliyor (ör. `decideBusinessRequest` 3 route'ta) — hash olmadan isimler çakışır ve deploy patlar. Hash, route'un logical adından deterministik türetilir.
- Kritik bilgi: **Lambda adı create-only'dir** — isim şeması değişirse tüm route Lambda'ları yeniden yaratılır; şemayı sabit tutun. Yeni route'lar otomatik isimlenir, elle `name:` verilirse transform dokunmaz.
- Doğrulama (kubi): 202/202 route Lambda'sı yeni isimle yaratıldı, eskiler silindi, 0 çakışma, 0 64-karakter ihlali, API HTTP 200, entegrasyonlar yeni fonksiyonlara bağlı.

### P1 — Sağlamlaştırma

**P1.1 — i18n Faz 1: İngilizce desteği** · kapsam: büyük — detay aşağıda ayrı bölümde. · **Faz 1a ✅ Uygulandı (2026-07-07)**
- Faz 1a uygulama notları: `next-intl@4.13.1`; [i18n/routing.ts](packages/frontend/i18n/routing.ts) (`localePrefix: "as-needed"` + **`localeDetection: false`** — otomatik dil yönlendirmesi bilinçli kapalı, TR ziyaretçi/bot davranışı değişmedi). **Tasarım kararı — paneller `[locale]` DIŞINDA:** yalnız `(public)` + `(auth)` `app/[locale]/` altına taşındı; 9 panel dizini `app/(panels)/` route group'una alındı (URL değişmedi, ikinci root layout). Neden: [proxy.ts](packages/frontend/proxy.ts) `withAuth` matcher'ı panelleri koruyor — `[locale]` altına girselerdi `/en/admin` matcher'dan kaçar, auth bypass doğardı. proxy.ts artık intl+withAuth kompozisyonu (`/hesabim` passthrough; matcher ürün slug'ları nokta içerebildiği için genel nokta-dışlama yerine uzantı bazlı). Static rendering `setRequestLocale`+`generateStaticParams` ile korundu: 15 TR + 15 EN sayfa prerender. Kesişen düzeltmeler: `next.config.mjs` silindi (P1.5a ✅ — tek config `.ts` + intl plugin), maplibre CSS root layout'tan harita bileşenlerine taşındı (P2.1 kısmi), **hardcoded `.com.tr` metadataBase → env-driven** (canlı domain `.xyz` — OG/canonical düzeldi). Doğrulama: typecheck + full build + 7/7 route smoke + `html lang` tr/en + auth redirect birebir. Faz 2'de paneller çevrilecekse taşıma + matcher değişikliği AYNI işte yapılmalı (bkz. (panels)/layout.tsx yorumu).

**P1.2 — Validator kapsamını tamamla** · kapsam: orta
- Ne: responseValidator'sız 9 `actions.ts` dosyasına validator ekle: AdminApi `assets`, `materials`, `productAttributeValues`, `productMeasurements`; OwnerApi `users`; ProtectedApi `colors`, `users`; PublicApi `productAttributeValues`, `productVariantSuppliers`. requestValidator'sız 2 dosya da aynı işte kapatılmalı.
- Neden: Response shape sözleşmesi tutarsız; frontend bu endpoint'lerde sessiz shape kaymasına açık.
- Etki: **functions** (validator dosyaları + actions) + **frontend** (ilgili `features/**/api` modüllerinin beklediği shape ile validator birebir doğrulanmalı — validator gerçek response'tan dar yazılırsa çalışan endpoint'i kırar; önce mevcut response örnekleri toplanmalı). Dosya başına ayrı PR önerilir.

**P1.3 — Secrets'ı SST Secret'a taşı** · kapsam: orta
- Ne: `RDS_PASSWORD`, `GMAIL_SMTP_USER/APP_PASSWORD` → `sst.Secret`; [config.ts](config.ts) tüketicileri güncelle.
- Neden: Secrets şu an `.env` + `process.env` ile taşınıyor; tek makineye bağımlı, rotasyonu izlenemez.
- Etki: **infra** (db.ts, e-posta Lambda'larının env wiring'i) + **functions** (Resource üzerinden okuma) + **README** (kurulum talimatı). RDS şifresi değişimi **prod DB bağlantısını etkiler** — şifreyi değiştirmeden yalnız taşıma yapılmalı, plan gösterip onay alınmalı.

**P1.4 — Kritik yol testleri** · kapsam: büyük (dilimlenebilir)
- Ne: Öncelik sırasıyla unit testler: `core/helpers/pricing` (para hesabı), `core/helpers/businessRequests/policy.ts` + `service.ts` (onay yetkisi), `authMiddleware.ts` (rol/erişim), `prisma/errors.ts` mapping.
- Neden: 6 test dosyasıyla; fiyatlama veya onay zincirinde bir regresyonun yakalanma şansı sıfıra yakın.
- Etki: yalnız **core** test dosyaları; ürün davranışı değişmez. P0.1'deki CI'ya bağlanır.

**P1.5 — `next.config` duplikasyonunu ve görsel optimizasyonunu netleştir** · kapsam: küçük
- Ne: `.mjs`/`.ts` ikilisinden birini sil (öneri: `.ts` kalsın). `images.unoptimized: true` bilinçliyse yorumla gerekçele; değilse OpenNext image optimization aç.
- Neden: İki config drift bombası; unoptimized görseller public katalogda LCP'yi doğrudan kötüleştirir.
- Etki: **frontend** + görsel optimizasyonu açılırsa **infra** (OpenNext image Lambda maliyeti — needs confirmation, maliyet konuşulmalı).

**P1.6 — Structured logging + correlation id (Lambda Powertools)** · kapsam: orta
- Ne: `@aws-lambda-powertools/logger` ile merkezi logger (`packages/core/src/core/observability/logger.ts`) + [middy.ts](packages/core/src/core/middy.ts) zincirine `injectLambdaContext` (`logEvent: false`, `clearState: true`) ve her isteğe korelasyon alanları ekleyen custom middleware: `requestId`, `routeKey`, `method`, `path`, `userSub`, `userGroups`, `statusCode`, `durationMs`, ilgili entity id/code. Tek noktadan eklendiği için 197 handler'ın tamamı otomatik kazanır. Referans: [Powertools Logger](https://docs.aws.amazon.com/powertools/typescript/latest/core/logger/).
- Neden: Şu an yalnız `errorLogger` var; genel hata mesajlarının arkasındaki gerçek sebep CloudWatch'ta izlenemiyor. `inputOutputLogger` tam da boyut/gürültü nedeniyle kapatılmıştı ([middy.ts:134](packages/core/src/core/middy.ts)) — Powertools `logEvent: false` ile aynı sorunu yaşatmadan yapısal log üretir.
- Etki: **core** (middy.ts + yeni `observability/` modülü + `package.json`) + **functions** (davranış değişmez, log formatı değişir — CloudWatch'ta mevcut log filtresi/alışkanlık varsa güncellenmeli). Kurulum notu: repo **npm workspaces** kullanıyor (pnpm değil) → `npm install @aws-lambda-powertools/logger -w @ceyhunlarweb/core`.
- Dikkat edilecekler:
  - `serviceName` sabit yazılmamalı; boundary bazında (`admin-api`, `public-api`, `protected-api`, `owner-api`, workflow) env'den verilmeli ki CloudWatch'ta API sınırına göre filtrelenebilsin.
  - `userSub`/`userGroups` loglanabilir; e-posta gibi PII taşıyan claim'ler loglanmamalı.
  - `appendKeys` çağrısı auth middleware **sonrasında** da zenginleştirilebilir (`event.user.id` DB id'si claim'lerden daha değerlidir); `clearState: true` invocation'lar arası sızıntıyı önler — Lambda execution reuse nedeniyle zorunlu.
  - `onError` log adımının mevcut `httpErrorHandlerMiddleware` ile sıralaması doğrulanmalı (middy `onError`'ları ters sırada çalıştırır); hata yutulmadan önce loglandığı bir smoke testle kanıtlanmalı.
- **Tracer + Metrics bilinçli olarak bu maddeye dahil değil**: `@aws-lambda-powertools/tracer` X-Ray active tracing gerektirir → tüm Lambda'larda infra değişikliği demektir (prod korumalı — CLAUDE.md gereği ayrı plan + onay); `metrics` EMF ile CloudWatch ingest maliyeti ekler. İkisi de Logger'dan fayda görüldükten sonra ayrı bir P2 kararı olarak değerlendirilmelidir.

**P1.7 — CI kapsamını genişlet: backend typecheck + lint temizliği + audit'i bloklayıcı yap** · kapsam: orta
- Ne: (a) Backend typecheck: root [tsconfig.json](tsconfig.json) `include`'u tüm repoyu (`packages/**/*`, `infra/**/*`, `sst.config.ts`) kapsıyor; core/functions bunu miras aldığı için izole `tsc --noEmit` koşulamıyor — `.sst/platform`'un kendi `@types/node` kopyası 12k+ hata kaskadı üretiyor. Paket bazında `include` + `skipLibCheck` stratejisiyle tsconfig'ler ayrıştırılmalı. (b) Frontend lint'teki 1218 hata dilim dilim temizlenip lint job'u bloklayıcı yapılmalı. (c) Audit job'u bloklayıcı yapılmalı — ancak P0.3 sonrası kalan 4 high tamamen `sst` CLI zincirinde olduğundan bu, P2.6 (SST 4) çözülmeden veya audit sst zincirini dışlayacak şekilde scope edilmeden mümkün değil.
- Neden: CI şu an yalnız frontend tipi ve 28 unit testi koruyor; backend'de tip regresyonu yakalanmıyor.
- Etki: root + paket `tsconfig.json`'ları (editör ve `sst dev` deneyimi etkilenebilir — dikkatli, tek tek doğrulanarak) + `.github/workflows/ci.yml` + frontend lint düzeltmeleri.

### P2 — İyileştirme

**P2.1 — Bundle diyeti** · kapsam: orta
- Ne: `PdfPreview` (pdfjs), harita bileşenleri (maplibre) ve mqtt hook'unu `next/dynamic` ile lazy yükle; [layout.tsx](packages/frontend/app/layout.tsx)'teki global `maplibre-gl.css` importunu harita bileşenlerine taşı. 425 client component'lik yüzeyde en büyük kazanım bu üç bağımlılıktadır; genel "use client azaltma" refactor'ı ancak sayfa bazında, ölçerek yapılmalı.
- Etki: yalnız **frontend**; davranış değişmez, route-level bundle küçülür.

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

**P2.5 — API throttle'larını sınıra göre ayrıştır** · kapsam: küçük
- Ne: Public/Protected/Admin üçünde de 100 rps / 200 burst aynı. Admin/Owner daha düşük, Public gerekirse daha yüksek tutulmalı.
- Etki: yalnız **infra** (üç `*Api.ts`).

**P2.6 — SST 4 yükseltme kararı** · kapsam: büyük, ayrı proje
- Ne: `sst@3.19.3` → SST 4 (latest 4.17.0). Not: SST 4, v2→v3 gibi bir rewrite değil — registry'de `ion` dist-tag'i 4.5.2'ye işaret ediyor, yani **aynı Ion çizgisinin devamı**; yine de major atlama olduğu için migration notları okunmadan ve kubi'de denenmeden geçilmez. P0.3'te kalan 4 high severity açığın tamamı SST 3'ün CLI zincirinde (`opencontrol`, `hono`, `@modelcontextprotocol/sdk`, `aws-sdk@2`) ve fix `sst@4.0.7+` gerektiriyor.
- Neden: Güvenlik etkisi sınırlı (bu bileşenler yalnız `sst dev`'de geliştirici makinesinde çalışır, deploy edilen Lambda'lara girmez) ama audit'in bloklayıcı olabilmesi ve SST'nin destek ömrü için orta vadede gerekli.
- Etki: **infra tamamı** + deploy zinciri; prod korumalı — SST 4 migration rehberiyle, önce kubi stage'de uçtan uca denenerek, CLAUDE.md gereği plan+onayla yapılmalı.

**P2.7 — Node 22 → 24 LTS geçişi** · kapsam: orta, izole adım
- Ne: `.nvmrc` (22.22.2) + root `engines` (`>=22 <23`) + Lambda runtime'ları `nodejs24.x`'e taşı. ARCHITECTURE'a göre bazı Cognito trigger Lambda'ları hâlâ `nodejs20.x` — bu işte hepsi normalize edilmeli. CI, `node-version-file: .nvmrc` okuduğu için otomatik uyar.
- Neden: Node 24 LTS Nisan 2028'e kadar destekli ve AWS Lambda'da mevcut; Node 22 bakımı Nisan 2027'de bitiyor. Acil değil ama planlı yapılmalı.
- Etki: **root config + infra (runtime'lar) + CI + lokal geliştirme**. Kural: başka hiçbir değişiklikle birleştirilmeden, tek başına, kubi'de uçtan uca doğrulanarak (özellikle Prisma native binding'leri ve `next build`).

**P2.8 — Frontend'den core'a doğrudan prisma importlarını kaldır** · kapsam: orta
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
3. **DB içeriği (ürün/kategori adları, açıklamalar, `usageFunction`) Faz 1'de çevrilmez.** EN sayfalarda ürün verisi TR görünür — bu bilinçli bir ara durumdur. İçerik çevirisi ayrı bir iştir ve **şema değişikliği** gerektirir (çeviri tablosu veya JSONB `translations` alanı) → CLAUDE.md gereği migration planı önce onaya sunulur.
4. **Bildirim persist mimarisi i18n'in en zor problemi**: [messaging.ts](packages/core/src/core/helpers/userAccess/messaging.ts) ve [businessRequests/messaging.ts](packages/core/src/core/helpers/businessRequests/messaging.ts) bildirimleri **üretim anında TR metin** olarak `UserNotification`'a yazıyor. Doğru hedef: `templateKey + params` persist edip render anında çevirmek — ama bu, migration + tüm subscriber ve frontend notification okuma zincirinin senkron değişimini gerektirir → **Faz 3**. Faz 1-2'de bildirimler TR kalır.
5. **Backend hata mesajları için kod tabanlı yaklaşım**: response'lara makine-okur `code` alanı ekle (backward compatible — mevcut TR `message` alanı korunur), frontend `code`'u kendi locale'inde çevirir. Alternatif olan Accept-Language ile backend çevirisi, [middy.ts](packages/core/src/core/middy.ts)'deki hazır `httpContentNegotiation` sayesinde mümkün ama e-posta/bildirim gibi async bağlamlarda dil bilgisi taşımadığı için eksik kalır. Kod tabanlı yaklaşım önerilir. E-postalar için Faz 3'te `User.preferredLocale` alanı (şema değişikliği — onaylı migration).

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

## Doğrulanamayan / Onay Bekleyen Noktalar

- `images.unoptimized: true` bilinçli mi? (OpenNext image optimization maliyet kararı olabilir)
- `npm audit`'teki `hono`/`mcp-sdk`/`aws-sdk` bulgularının deploy artefaktına girip girmediği
- Panel yüzeylerinin (admin/satış/portal) EN çevirisine ihtiyaç olup olmadığı (iş kararı)
- `multiAz` ve storage büyütme maliyet onayı
- Runtime'da hangi `next.config`'in yüklendiği (`.mjs` beklenir)
