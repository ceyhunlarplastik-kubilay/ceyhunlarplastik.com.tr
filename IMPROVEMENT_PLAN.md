# Improvement Plan

Bu dosya **yalnızca açık (henüz yapılmamış) işleri** tutar. Tamamlanan dilimlerin
tarihli uygulama notları [IMPROVEMENT_LOG.md](IMPROVEMENT_LOG.md)'de — kronolojik
arşiv, projenin hafızası. Bir dilim bitince: maddesi buradan çıkar, uygulama notu
(ne yapıldı / neden / nasıl doğrulandı / ne kaldı) LOG'a eklenir.

**Son güncelleme:** 2026-08-29 (PLAN/LOG ayrımı). Çıkış noktası 2026-07-07 denetimi;
o günden bugüne **P0 6/6** ve **P1 8/8** kapandı, **P2'nin çoğu** tamam (P2.1/2.6
tamam+deploy; P2.4-A/B deploy edildi; P2.7 kod commit'li, API Lambda deploy'u kaldı).
Aşağıdakiler kalan iştir. Detaylı tarihçe ve kapanmış maddeler için LOG'a bak.

Çalışma düzeni değişmedi: işler dilim dilim yürür, her dilim öncesi kısa plan +
onay; kod değişikliğini ajan yapar, commit/push/deploy kullanıcıda (bkz.
[CLAUDE.md](CLAUDE.md)).

---

## Açık İşler

### P2.2 — next-auth v4 → Auth.js v5 kararı · kapsam: büyük, riskli · ⛔ hiç başlanmadı
- Ne: v5 migration'ını ayrı bir proje olarak planla; o zamana dek v4 + `overrides` ile yaşa (P0.3'te yapıldı).
- Neden: v4 bakım modunda ve eski bağımlılık çekiyor (`uuid` moderate açığı — sömürü yolu yok, kalıcı çözüm bu madde). Custom Cognito credentials + refresh akışı ([lib/auth/auth.ts](packages/frontend/lib/auth/auth.ts)) migration'da en kırılgan parça. Acele edilmemeli.
- Etki: **frontend** (session akışı) + dolaylı olarak tüm panel yüzeyleri.

### P2.3 — X-Ray tracing + custom metrics (Powertools Tracer/Metrics) · kapsam: orta, infra onaylı · ⛔ hiç başlanmadı
- Ne: P1.6'daki Logger yerleştikten sonra `@aws-lambda-powertools/tracer` (X-Ray) ve `@aws-lambda-powertools/metrics` (EMF) eklenmesi.
- Neden: Logger "ne oldu"yu, tracer "nerede yavaşladı"yı (Prisma sorgusu mu, Cognito çağrısı mı, cold start mı) gösterir; metrics iş-seviyesi sayaçlar (ör. onay/red oranı) sağlar.
- Etki: **infra** (tüm Lambda'larda X-Ray active tracing — prod korumalı, plan + onay şart; CloudWatch/X-Ray maliyeti değerlendirilmeli) + **core** (middy zinciri) + **functions**.
- **Küçük açık uç (P2.5'ten devir):** Gateway seviyesinde reddedilen 429'lar (Lambda hiç tetiklenmeden) hiçbir metriğe düşmüyor — HTTP API'de adanmış metrik yok, access log kurulumu gerekir. Opsiyonel, gözlenmiş sorun değil.

### P2.4 kalanı — RDS dayanıklılığı doğrulaması · A+B deploy edildi, C + drill açık
- A (restore runbook) + B (`deletionProtection: true`, `skipFinalSnapshot: false`) **deploy edildi ve canlıdan doğrulandı** (2026-08-07). Detay LOG'da.
- **Kalan:**
  - **RPO/RTO iş onayı** — README "Disaster Recovery" bölümünde önerilen RPO ~5dk / RTO ~4sa değerleri hâlâ iş onayı bekliyor.
  - **İlk restore drill'i** — hiç koşulmadı. Gerçek RTO'yu öğren; ayrıca SST stack'inin restore edilmiş yeni instance'ı benimsemesi (RDS Proxy target + `DIRECT_RDS_HOST` yeniden bağlama) kanıtlanmış prosedür değil — drill netleştirecek.
  - **C — Multi-AZ** (iş/maliyet kararı): instance ücretini ~ikiye katlar (t4g.micro+20GB için kabaca **~+15-25 USD/ay tahmini, doğrulanmadı**). Yalnız altyapı arızasında otomatik failover verir; kötü migration/DELETE/bozulmaya karşı KORUMAZ. İhtiyaç doğarsa geri-dönülebilir açılır.

### P2.7 — Node 22 → 24 LTS · kapsam: orta · ✅ kod commit'li (75e1b82, 2026-08-26), ⚠️ API Lambda'ları henüz prod'a DEPLOY EDİLMEDİ
- Commit'lenen: `.nvmrc` → `24.19.0`, `engines` → `>=24 <25`, 7 infra dosyasında 15 runtime pin → `nodejs24.x`. Node 24.19.0 + gerçek Postgres 17 + Prisma 7.8 altında lokalde doğrulandı (detay LOG). CI zaten `.nvmrc`'yi okuduğu için Node 24'te koşuyor.
- Frontend Lambda'ları **prod'da zaten `nodejs24.x`** (P2.6 ile, 2026-08-07). Kalan iş: `sst deploy --stage prod` ile **API Lambda'larının** (Admin/Public/Protected/Owner + `businessWorkflow`/`userAccessLifecycle`/`googleMaps`) `nodejs22.x` → `nodejs24.x` geçişini canlıya almak — tek başına, başka değişiklikle birleştirmeden; deploy sonrası duman testi (özellikle Prisma native binding'leri).
- Kalan loose end: [cognito.ts](infra/cognito.ts) `postConfirmation` trigger'ı hâlâ `nodejs20.x` (75e1b82 buna dokunmadı; Node 20 EOL geçti) → `nodejs24.x`'e normalize edilmeli. Auth-kritik (VPC+RDS linkli, kayıt sonrası DB kullanıcısı oluşturur) → kubi'de uçtan uca signup testi şart.

### P2.8 opsiyonel kalanı — frontend'i VPC'den çıkarma · ana iş ✅ (2026-08-25)
- Frontend'de `prisma` importu HİÇ kalmadı (yalnız `@core/*` alias ile saf helper/type importları — CLAUDE.md'ye uygun), `link: [rds]` kaldırıldı, session hot-path'i I/O'suz. `user-access.ts` HTTP client'a geçti; `geocodingService.ts` (Nominatim proxy) tamamen silinip Google Places'e taşındı (b8230f3). Detay LOG'da.
- **Kalan (opsiyonel, ölçüm gerekir):** [frontend.ts](infra/frontend.ts) hâlâ `vpc` geçiriyor (satır 28) — RDS bağı koptuğu için frontend server artık VPC'de olmak zorunda değil. VPC'den çıkarmak cold start + NAT egress kazandırır ama **ölçülerek** yapılmalı (VPC'siz Lambda'nın internet erişimi, SES/S3 erişimi, güvenlik grubu etkileri). Ayrı dilim.

### Asenkron asset yükleme (S3 event-driven) — pilot: kategori · Dilim 1–3 ✅ (2026-09-04, LOG) *(kullanıcı talebiyle)*
- **Yapıldı (LOG):** şema `AssetUploadStatus`; presign `PENDING_UPLOAD` satırı yazıyor (id'li key, 900s); `infra/assetLifecycle.ts` `publicBucket.notify` → `confirmCategoryAssetUpload` Lambda `ACTIVE`'e çeviriyor (idempotent, PRIMARY demote-on-confirm); `AssetUploader` bloklamıyor + `usePendingAssetReconciler` poll + `AssetGrid`/`AssetPreviewPanel` "İşleniyor" rozeti; `categoryRepository` public/liste okumaları `uploadStatus=ACTIVE`, yalnız yönetim dialog'u (`getCategory`/`updateCategory` `includeAllAssets`) PENDING görür. Kubi testi + `sst diff --stage prod` kullanıcıda.
- **Dilim 4 (opsiyonel, kalan tek iş):** günlük `sst.aws.Cron` zombi-sweep — `PENDING_UPLOAD` + `createdAt < now()-24h` olan Asset satırlarını sil (`infra/googleMaps.ts` cron deseni, prod-only ya da tüm stage'ler). İstenirse ürün/materyal/attribute-value asset yükleme akışlarına aynı `createPendingAsset` + notify deseni; 2. tüketici (thumbnail/tarama) gerekirse `bucket.notify` → EventBridge Bus refactor (handler taşıma-bağımsız yazıldı).
- **Karar (2026-09-04, tekrar tartışma):** `s3:ObjectRemoved` **eklenmeyecek** — silme/güncelleme akışları DB-first ve senkron (`deleteAssetHandler` `deleteS3Object` + satır sil; "değiştir" = yeni presign + eski asset DELETE; metadata `PUT /assets/{id}` S3'e dokunmaz). `ObjectRemoved` yalnız app-dışı silme (Lifecycle expiration / elle konsol) eklenirse anlamlı → o zaman zombi-sweep'in yanına dangling-row reconciler'ı olarak. Filtre ekseni **prefix** (`categories/`), suffix DEĞİL (uzantısız key üretilebiliyor + tüm tipler onaylanmalı). `events: ["s3:ObjectCreated:*"]` zaten "all events"i daraltıyor. Genelleştirmede: çakışmayan kardeş prefix'ler VEYA filtresiz tek notification + Lambda içi `startsWith` yönlendirme (handler hazır).
- Etki: **infra** (`assetLifecycle.ts` cron) · gerekirse **core/functions** (diğer asset akışları).

### Tedarikçi sözlüğü teknik resmi (async yükleme) — Dilim 1 ✅ (2026-09-04, LOG) *(kullanıcı talebiyle)*
Amaç: `ProductSupplierCodesDialog`'da her tedarikçi harfi (ürün modeli + firma, ör. "1.23 modelinde A = Özgen Plastik") için **TEK** teknik resim. Async pattern yeniden kullanılıyor (presign → `PENDING_UPLOAD` satır → S3 `ObjectCreated` → confirm Lambda → `ACTIVE`). Branch: `feat/supplier-code-technical-drawing`.
- **Yapıldı (Dilim 1, LOG):** `Asset.productSupplierCodeId` FK (nullable, `onDelete: Cascade`) + `ProductSupplierCode.assets`; `generateProductSupplierCodeAssetUpload` presign helper (key `product-supplier-codes/{productId}/{codeId}/{assetId}.{ext}`, 900s); `productSupplierCodeRepository` `list/create/update` yanıtına `technicalDrawing` (ACTIVE tercihli, `buildAssetUrl`); `remove()` silmeden önce drawing S3 nesnelerini temizler; `supplierCodeSchema` response validator'a `technicalDrawing`. Migration + kubi testi kullanıcıda.
- **Dilim 2:** presign ucu `POST /products/{id}/supplier-codes/{codeId}/technical-drawing/presign` (`createProductSupplierCodeAssetUploadHandler` + action + type + request/response validator) · `confirmProductSupplierCodeAssetUpload.ts` Lambda (prefix guard `product-supplier-codes/`, sadece PENDING→ACTIVE) · `infra/assetLifecycle.ts` 2. kardeş notification (`filterPrefix: "product-supplier-codes/"`, kategori notification'ına dokunulmaz). Etki: **functions + infra** (prod'a gider → `sst diff --stage prod` önizleme kullanıcıda).
- **Dilim 3:** frontend — `api/types`+`api`+`hooks` (`usePresignProductSupplierCodeDrawing` + pending reconciler), `ProductSupplierCodesDialog`'a "Teknik resim" kolonu (ACTIVE→thumbnail+aç/sil, PENDING→"İşleniyor" rozeti, boş→yükle; bloklamaz).
- **Dilim 4:** Dilim 1–3 kubi'de doğrulanınca `feat/supplier-code-technical-drawing` → `main` merge. Prod deploy + prod migration kullanıcıda.

### i18n — kalan fazlar (P1.1 devamı)

**Yapıldı:** Faz 1a (altyapı) + Faz 1b (public/auth/home) + Category Translation pilotu +
varyant sözlükleri (Color/Material/MeasurementType) + 14 dile kadar dalgalar (de/fr/es/it/pt/pl/ru/ar/ko/ja/zh/hi).
Detaylı ilerleme LOG'da. Per-sayfa reçete: [.claude/skills/i18n-migrate](.claude/skills/i18n-migrate/SKILL.md).

**Değişmeyen strateji (yeni i18n işinde bağlayıcı):**
- **Kütüphane `next-intl`**, **URL modeli `localePrefix: "as-needed"`** — mevcut TR URL'ler hiç değişmez, EN `/en/...` altında. `localeDetection: false`.
- **Paneller `[locale]` DIŞINDA** (`app/(panels)/` route group) — proxy.ts `withAuth` matcher'ı yüzünden; panel çevrilecekse taşıma + matcher değişikliği AYNI işte.
- **Zod şemaları factory deseni** — modül-seviyesi şema hook'a erişemez: `buildXSchema(t)` + `useMemo`. Client+server ortak şemalar (server route da kullanıyorsa) TR bırakılır, Faz 3'e.
- **DB içeriği Translation Table ile, model bazında** — additive `XTranslation` tablosu, legacy `name`/`slug` kolonları geçiş tamamlanana kadar korunur. Legacy kolon silme her zaman ayrı migration + drift=0 + onay.
- **Eksik çeviri:** public API TR kaynağa fallback + `translationMissing: true`; eksik EN sayfa `noindex` + sitemap dışı.

**Faz 2 — panel yüzeyleri** (admin/satış/satın alma/portal, ~280 dosya) · ⏸️ ERTELENDİ
- İç kullanıcılar TR çalıştığı için iş kararı bekliyor (bkz. Doğrulanamayan Noktalar). Gerekirse `AccountStatusPageClient` (`/hesabim`) ve panel-içi paylaşılan bileşenler bu kapsamda.

**Faz 3 — backend mesajları + bildirim/e-posta mimarisi** · ⏸️ ERTELENDİ
- [messaging.ts](packages/core/src/core/helpers/userAccess/messaging.ts) ve [businessRequests/messaging.ts](packages/core/src/core/helpers/businessRequests/messaging.ts) bildirimleri **üretim anında TR metin** olarak `UserNotification`'a yazıyor. Doğru hedef: `templateKey + params` persist edip render anında çevirmek → migration + tüm subscriber ve frontend notification okuma zincirinin senkron değişimi.
- Backend hata mesajları: response'lara makine-okur `code` alanı ekle (backward compatible, TR `message` korunur), frontend `code`'u kendi locale'inde çevirir.
- E-postalar için `User.preferredLocale` alanı (şema değişikliği — onaylı migration).

### B3 — ölçü şablonu `isRequired` toggle sonrası ölçü birleştirme · düşük öncelik
- `ProductSize` artık ZORUNLU ölçü imzasıyla tekilleşiyor (2026-09-03 LOG). Bir ölçü
  şablonda zorunlu→opsiyonel çevrilirse, o ölçüyle ayrışmış mevcut `ProductSize`
  kayıtları aynı imzaya düşer ama `recalculateProductVariantCodes` onları BİLEREK
  otomatik birleştirmez (sipariş/talep referanslı varyantı yok etmemek için).
  Gerekirse: tek seferlik `backfill:recode-product-sizes` yeniden çalıştırılır
  (referanslı olanları zaten atlıyor) ya da admin'e açık "ölçüleri birleştir"
  eylemi eklenir. Bugün gerek yok — kayıtlar bozulmuyor, yalnız fazladan kod kalıyor.

### B2 — latent migration: varyant ölçü parmak izi · onay gerekir, bugün gerek yok
- DB-side ölçü gruplaması için materialize `measurementFingerprint` kolonu (`ALTER ADD COLUMN` + backfill; ölçüler güvende, veri kaybettirmez). Bugün gerek yok: gruplama saf server helper'a taşındı (`groupVariantMeasurements`, sorgu zaten hızlı+cache'li). Varyant verisi çok büyürse ve DB-side `string_agg` gruplaması istenirse bu migration + onay gerekir.

---

## Kullanıcıda Bekleyen Adımlar

- **SNS e-posta aboneliği onayı** — `kubilayuysal.ceyhunlarplastik@gmail.com` adresine gelen AWS "Subscription Confirmation" linkine tıklanmalı. Tıklanana kadar 6MB payload alarmı + concurrency/throttle alarmları tetiklense de **bildirim gönderilmez** (istek 3 günde düşer). Teyit: `aws sns list-subscriptions-by-topic` → `SubscriptionArn` "PendingConfirmation" değil.
- **`.env` temizliği** — `RDS_PASSWORD`, `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `DEEPL_API_KEY` satırları silinebilir; kod artık SST Secret'tan okuyor (P1.3). `.env`'de KALMASI gerekenler: `AWS_REGION`, `HOSTED_ZONE_ID`, `DOMAIN`, `DOMAIN_CERTIFICATE_ARN`, `DEEPL_GLOSSARY_ID`, `DIRECT_RDS_HOST`.
- **Müşteri haritası rota optimizasyonu** (2026-08-28) — kubi doğrulaması bekliyor. Adımlar LOG'daki "Müşteri haritası: rota optimizasyonu" notunun "Kullanıcıda kalan" bölümünde.
- **P2.7 deploy** (yukarıda) — API Lambda'larının `nodejs24.x` geçişi commit'li ama prod'a deploy edilmedi; `sst deploy --stage prod` + duman testi. `postConfirmation` node20→24 normalizasyonu ayrı küçük iş.

---

## Doğrulanamayan / Onay Bekleyen Noktalar

- **Panel yüzeylerinin (admin/satış/portal) EN çevirisine ihtiyaç var mı?** — iş kararı; i18n Faz 2'nin ön şartı.
- **`npm audit` kalıntı high'ları** (`hono`/`js-yaml` — artık `prisma`/`@prisma/dev` + `shadcn`/`eslint` zincirlerinden, dev-only, deploy artefaktına girmez): CI audit job'unu bloklayıcı yapmaya değer mi, yoksa `--audit-level=critical` bloklayıcı + high advisory yeterli mi?
- **Multi-AZ + storage büyütme maliyet onayı** (P2.4-C).
- **next-auth v4 kalıntı `uuid` moderate açığı** — v5 migration'a (P2.2) kadar kabul mü? (Sömürü yolu yok: next-auth yalnız rastgele v4 üretir.)
- **`autoMinorVersionUpgrade: true`** (P2.6'da bilinçli geri alındı) — Postgres minor yamaları Pazartesi 00:33-01:03 UTC bakım penceresinde birkaç dakika kesintiyle uygulanır; tek AZ olduğumuz için bu kabul edildi, teyit.
