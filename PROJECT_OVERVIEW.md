# Project Overview

Bu dosya, mevcut dokümantasyonun yerine geçmez; `README.md`, `AGENTS.md` ve `ARCHITECTURE.md` için kısa bir indeks ve kod taramasına dayalı drift notudur. Açık iş takibi [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md)'de, tamamlanan işlerin tarihçesi [IMPROVEMENT_LOG.md](IMPROVEMENT_LOG.md)'dedir.

Proje; Ceyhunlar Plastik için public katalog, müşteri portalı, admin/owner yönetimi ve satış/satın alma operasyon panellerini aynı SST monorepo içinde birleştirir.
Backend tarafında API Gateway + Lambda + Prisma/PostgreSQL, frontend tarafında Next.js App Router kullanılır.
İş talebi/onay akışları generic `BusinessRequest` modeli, Step Functions, EventBridge Bus ve gerektiğinde SST Realtime fan-out ile çalışır.

## Ana Referanslar

| Doküman | Ne için okunur |
|---|---|
| [README.md](README.md) | Kurulum, scriptler, migration/deploy komutları, disaster-recovery ve DeepL çeviri runbook'ları |
| [AGENTS.md](AGENTS.md) | Katkı kuralları, paket sınırları, frontend/backend çalışma prensipleri |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Güncel sistem yapısı, auth, workflow, domain modeli ve request flow notları |
| [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) | Yalnızca **açık (henüz yapılmamış)** işler — öncelikli aksiyon listesi |
| [IMPROVEMENT_LOG.md](IMPROVEMENT_LOG.md) | Tamamlanan dilimlerin tarihli uygulama arşivi (projenin hafızası) |

## API Sınırları

| Boundary | Dosya | Kısa açıklama |
|---|---|---|
| Public API | [infra/PublicApi.ts](infra/PublicApi.ts) | Public katalog, geo lookup, public lead/customer/web request ve public ürün verileri |
| Protected API | [infra/ProtectedApi.ts](infra/ProtectedApi.ts) | Giriş yapmış iş kullanıcıları, müşteri portalı, satış/satın alma/supplier workspace akışları |
| Admin API | [infra/AdminApi.ts](infra/AdminApi.ts) | Admin/owner yönetim yüzeyleri, ürün/kategori/CRM/order/onay yönetimi |
| Owner API | [infra/OwnerApi.ts](infra/OwnerApi.ts) | Owner seviyesinde sınırlı kullanıcı/grup yönetimi |

## Nereye Bakılır?

| Konu | Önce bakılacak yer | Ardından doğrulanacak kod |
|---|---|---|
| Yeni endpoint eklemek | [AGENTS.md](AGENTS.md) Backend Rules + [ARCHITECTURE.md](ARCHITECTURE.md) Extension Guide | `infra/*Api.ts`, `packages/functions/src/<Boundary>/functions/**` |
| API boundary seçimi | [AGENTS.md](AGENTS.md) APIs | `infra/PublicApi.ts`, `infra/ProtectedApi.ts`, `infra/AdminApi.ts`, `infra/OwnerApi.ts` |
| Lambda handler pattern | [AGENTS.md](AGENTS.md) Backend Rules | `packages/functions/src/**/actions.ts`, `packages/core/src/core/middy.ts` |
| Shared backend logic | [AGENTS.md](AGENTS.md) Core Layer Rules | `packages/core/src/core/helpers/**`, `packages/core/src/core/helpers/prisma/**` |
| Prisma modeli ve migration | [README.md](README.md) Prisma + [AGENTS.md](AGENTS.md) Database Rules | `packages/core/prisma/schema.prisma`, `packages/core/prisma/migrations/**` |
| Auth ve role modeli | [ARCHITECTURE.md](ARCHITECTURE.md) Authentication and Access Lifecycle | `infra/cognito.ts`, `packages/core/src/core/middleware/authMiddleware.ts`, `packages/core/prisma/schema.prisma` |
| Kullanıcı access lifecycle | [ARCHITECTURE.md](ARCHITECTURE.md) Access lifecycle | `infra/userAccessLifecycle.ts`, `packages/functions/src/UserAccessLifecycle/**` |
| Realtime bildirimler | [ARCHITECTURE.md](ARCHITECTURE.md) Business workflow + access lifecycle notları | `infra/userAccessLifecycle.ts`, `infra/businessWorkflow.ts`, `packages/frontend/features/notifications/**` |
| Business request workflow | [ARCHITECTURE.md](ARCHITECTURE.md) Business Request Workflow | `infra/businessWorkflow.ts`, `packages/functions/src/BusinessWorkflow/**`, `packages/core/src/core/helpers/businessRequests/**` |
| Müşteri portalı | [ARCHITECTURE.md](ARCHITECTURE.md) Customer portal flow | `packages/frontend/app/musteri/**`, `packages/frontend/features/customerPortal/**`, `packages/functions/src/ProtectedApi/functions/crm/**` |
| Satış workspace | [ARCHITECTURE.md](ARCHITECTURE.md) Sales and purchasing workspaces | `packages/frontend/app/satis/**`, `packages/functions/src/ProtectedApi/functions/crm/**` |
| Satın alma workspace | [ARCHITECTURE.md](ARCHITECTURE.md) Sales and purchasing workspaces | `packages/frontend/app/satinalma/**`, `packages/functions/src/ProtectedApi/functions/**` |
| Veri girişi workspace | [AGENTS.md](AGENTS.md) Access lifecycle + UI rules | `packages/frontend/app/veri-girisi/**`, shared admin feature components |
| CRM ve müşteri adresleri | [ARCHITECTURE.md](ARCHITECTURE.md) CRM and portal model | `packages/core/prisma/schema.prisma`, `packages/frontend/features/admin/customers/**`, `packages/frontend/features/customerLocations/**` |
| Geo selector verileri | [AGENTS.md](AGENTS.md) Reference geo data | `packages/core/prisma/schema.prisma`, `packages/functions/src/PublicApi/functions/geo/**` |
| Özel müşteri fiyatları | [AGENTS.md](AGENTS.md) Customer-specific special prices | `CustomerVariantSpecialPrice`, `packages/frontend/features/**/specialPrices/**` |
| Public katalog SSR/cache | [AGENTS.md](AGENTS.md) SSR and SEO | `packages/frontend/app/(public)/**`, `packages/frontend/features/public/**/server/**` |
| Infra kaynakları | [ARCHITECTURE.md](ARCHITECTURE.md) Infrastructure | `sst.config.ts`, `infra/*.ts` |
| Deployment ve migration | [README.md](README.md) Deployment + Prisma | `package.json`, `infra/db.ts`, `packages/core/prisma.config.ts` |
| Kod ajanı kuralları | [AGENTS.md](AGENTS.md) tamamı | Gerçek uygulama için ilgili feature ve infra dosyaları |

## Gerçek Kodda Doğrulanan Ana Yüzeyler

| Alan | Kodda görülen durum |
|---|---|
| Workspaces | Root `package.json` `packages/*` kullanıyor; `core`, `functions`, `frontend`, `scripts` mevcut |
| Infra dosyaları | 16 dosya: `db`, `cognito`, `storage`, `router`, `frontend`, `cors`, `apiLimits`, `googleMaps`, `lambdaNaming`, `PublicApi`, `ProtectedApi`, `AdminApi`, `OwnerApi`, `businessWorkflow`, `userAccessLifecycle`, `observability` |
| Cognito grupları | `owner`, `admin`, `user`, `supplier`, `purchasing`, `sales`, `sales_director`, `customer`, `content_editor` |
| Realtime | `UserAccessRealtime` kaynağı access ve notification topic prefixleriyle kullanılıyor |
| Ana workflow | `BusinessApprovalWorkflow` state machine + `BusinessWorkflowBus` + subscriber Lambda'ları |
| Test yüzeyi | 114 test dosyası (kabaca core 544 · functions 297 · frontend 310 test); pricing, approval policy, authMiddleware, validator derleme ve i18n sızıntı kapıları kapsanıyor |

## Bilinen Doküman/Kod Sapmaları

**2026-08-29:** README.md, AGENTS.md ve ARCHITECTURE.md koda karşı tazelendi
(SST v4; 4 paket; 9 Cognito grubu; sınır-özel throttle + `infra/apiLimits.ts`;
`infra/*Api.ts` endpoint kaynağı; güncel varyant kod sistemi; harita/geocoding
Google Maps + Places'e taşındı, Nominatim proxy'si silindi; `isSalesDirector`
role flag'i; `Supplier.assignedPurchasingSuppliers` çoklu-atama ilişkisi;
`responseValidator` handler-başına opsiyonel; 14 dilli next-intl i18n bölümü).
Bilinen aktif sapma yok.

Yeni bir sapma fark edildiğinde buraya `[Dosya / Konu] — X diyor, kodda Y gördüm`
formatında ekleyin.
