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

**P0.3 — Dependency açıklarını kapat** · kapsam: orta
- Ne: `next@16.1.6` → yamalı sürüme yükselt; `nodemailer` yükselt; kırıcı olmayan `npm audit fix`. `next-auth@4`'ün `uuid` açığı için `overrides` ile pin (v5 migration'ı P2'ye — bkz. P2.2).
- Neden: 8 high severity açık production bağımlılık zincirinde.
- Etki: **frontend** (Next yükseltmesi — build ve tüm sayfalar regresyon testi ister) + **functions** (nodemailer — 3 e-posta Lambda'sı: [sendUserAccessEmail.ts](packages/functions/src/UserAccessLifecycle/functions/sendUserAccessEmail.ts), [sendBusinessRequestEmail.ts](packages/functions/src/BusinessWorkflow/functions/sendBusinessRequestEmail.ts), [sendCustomerPortalInvitationEmail.ts](packages/functions/src/shared/mail/sendCustomerPortalInvitationEmail.ts)). Not: `hono`/`mcp-sdk`/`aws-sdk` bulguları büyük olasılıkla `sst` CLI zinciri (runtime'a girmiyor olabilir) — deploy artefaktında doğrulanmalı, needs confirmation.

**P0.4 — Supplier soft-delete `findUnique` kaçağını kapat** · kapsam: küçük (ama davranış değişikliği)
- Ne: [prisma.ts](packages/core/src/core/db/prisma.ts) supplier extension'ına `findUnique` (ve `deleteMany`) override'ı ekle — `color` ile simetrik.
- Neden: Soft-delete edilmiş supplier, `findUnique` üzerinden admin/portal yüzeylerine sızabilir.
- Etki: **core** (prisma.ts) + **tüm supplier okuyan handler'lar**. Önce `supplier.findUnique` çağrıları taranmalı: pasif supplier'a bilerek erişen bir akış (ör. admin bakım ekranı) varsa o akış kırılır — değişiklikten önce çağrı envanteri çıkarılmalı.

**P0.5 — Prod alarmlarını bildirime bağla** · kapsam: küçük
- Ne: SNS topic + e-posta aboneliği; [observability.ts](infra/observability.ts) alarmlarında `actionsEnabled: true` + `alarmActions`.
- Neden: Şu an prod'da Lambda concurrency tükenmesi veya frontend throttle olsa kimse haber almaz.
- Etki: yalnız **infra**. `prod` stage korumalı — CLAUDE.md gereği uygulamadan önce plan sunulmalı.

### P1 — Sağlamlaştırma

**P1.1 — i18n Faz 1: İngilizce desteği** · kapsam: büyük — detay aşağıda ayrı bölümde.

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
- Ne: (a) Backend typecheck: root [tsconfig.json](tsconfig.json) `include`'u tüm repoyu (`packages/**/*`, `infra/**/*`, `sst.config.ts`) kapsıyor; core/functions bunu miras aldığı için izole `tsc --noEmit` koşulamıyor — `.sst/platform`'un kendi `@types/node` kopyası 12k+ hata kaskadı üretiyor. Paket bazında `include` + `skipLibCheck` stratejisiyle tsconfig'ler ayrıştırılmalı. (b) Frontend lint'teki 1218 hata dilim dilim temizlenip lint job'u bloklayıcı yapılmalı. (c) P0.3 sonrası audit job'u bloklayıcı yapılmalı.
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

### Faz 1 uygulama sırası (her adım bağımsız doğrulanabilir)
1. `next-intl` kurulumu + `messages/tr.json` (mevcut metinler) + `middleware.ts` + `[locale]` taşıma — **davranış değişikliği sıfır**, tüm site hâlâ TR.
2. `html lang`, root metadata ve provider'ların locale-aware hale gelmesi.
3. `(public)` sayfa sayfa: string'ler `tr.json`'a, `en.json` çevirileri, sayfa başına PR.
4. Auth ekranları + zod mesajları (auth şemalarındaki TR mesajlar message catalog'dan beslenir).
5. SEO katmanı: hreflang, `sitemap.ts`, `robots.ts`, locale-aware `generateMetadata`.
6. Dil değiştirici UI (public navbar) — en son, her şey çalışırken.

## Skill Önerileri

| İhtiyaç | Öneri |
|---|---|
| PR/branch denetimi | Hazır: `/code-review` (her P0-P1 PR'ında), `/security-review` (P0.2, P0.3, P1.3 gibi güvenlik dokunuşlarında) |
| Değişiklik doğrulama | Hazır: `verify` skill — özellikle `[locale]` taşıması ve Next yükseltmesi sonrası uçtan uca akış sürme |
| i18n göçü | **Proje-özel skill oluşturulmalı** (`i18n-migrate`): bir sayfanın/feature'ın TR string'lerini namespace konvansiyonuyla catalog'a taşıma adımları, `getTranslations`/`useTranslations` kalıpları, hreflang kontrol listesi. 70+ dosyalık tekrarlı iş — skill tutarlılığı garanti eder. `skill-creator` ile üretilebilir. |
| Validator tamamlama | **Proje-özel skill oluşturulmalı** (`add-response-validator`): mevcut response örneğini toplama → Zod validator yazma → `actions.ts` bağlama → frontend shape doğrulama checklist'i. 9 dosyalık tekrarlı iş. |
| Yeni endpoint | Opsiyonel: AGENTS/ARCHITECTURE'daki endpoint ekleme adımları zaten net; skill'e dönüştürmek düşük öncelik. |

## Doğrulanamayan / Onay Bekleyen Noktalar

- `images.unoptimized: true` bilinçli mi? (OpenNext image optimization maliyet kararı olabilir)
- `npm audit`'teki `hono`/`mcp-sdk`/`aws-sdk` bulgularının deploy artefaktına girip girmediği
- Panel yüzeylerinin (admin/satış/portal) EN çevirisine ihtiyaç olup olmadığı (iş kararı)
- `multiAz` ve storage büyütme maliyet onayı
- Runtime'da hangi `next.config`'in yüklendiği (`.mjs` beklenir)
