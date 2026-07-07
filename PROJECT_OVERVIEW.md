# Project Overview

Bu dosya, mevcut dokümantasyonun yerine geçmez; `README.md`, `AGENTS.md` ve `ARCHITECTURE.md` için kısa bir indeks ve kod taramasına dayalı drift notudur.

Proje; Ceyhunlar Plastik için public katalog, müşteri portalı, admin/owner yönetimi ve satış/satın alma operasyon panellerini aynı SST monorepo içinde birleştirir.
Backend tarafında API Gateway + Lambda + Prisma/PostgreSQL, frontend tarafında Next.js App Router kullanılır.
İş talebi/onay akışları generic `BusinessRequest` modeli, Step Functions, EventBridge Bus ve gerektiğinde SST Realtime fan-out ile çalışır.

## Ana Referanslar

| Doküman | Ne için okunur |
|---|---|
| [README.md](README.md) | Kurulum, scriptler, migration/deploy komutları ve eski template kökenli API notları |
| [AGENTS.md](AGENTS.md) | Katkı kuralları, paket sınırları, frontend/backend çalışma prensipleri |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Güncel sistem yapısı, auth, workflow, domain modeli ve request flow notları |

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
| Infra dosyaları | `db`, `cognito`, `storage`, `router`, `frontend`, `PublicApi`, `ProtectedApi`, `AdminApi`, `OwnerApi`, `businessWorkflow`, `userAccessLifecycle`, `observability` mevcut |
| Cognito grupları | `owner`, `admin`, `user`, `supplier`, `purchasing`, `sales`, `sales_director`, `customer`, `content_editor` |
| Realtime | `UserAccessRealtime` kaynağı access ve notification topic prefixleriyle kullanılıyor |
| Ana workflow | `BusinessApprovalWorkflow` state machine + `BusinessWorkflowBus` + subscriber Lambda'ları |
| Test yüzeyi | Sınırlı sayıda unit test var; kapsam helper/schema/store ağırlıklı |

## Bilinen Doküman/Kod Sapmaları (Doğrulanmalı)

`[README.md / Workspaces] — README.md şunu söylüyor: "This template uses npm Workspaces with 3 packages" — kodda gördüğüm: "root package.json workspaces olarak packages/* kullanıyor ve packages/frontend dahil dört ana package klasörü mevcut: core, functions, frontend, scripts."`

`[README.md / Infra listesi] — README.md şunu söylüyor: "infra/db.ts, infra/cognito.ts, infra/AdminApi.ts, infra/PublicApi.ts, infra/ProtectedApi.ts, infra/OwnerApi.ts" — kodda gördüğüm: "infra/ içinde bunlara ek olarak frontend.ts, storage.ts, router.ts, businessWorkflow.ts, userAccessLifecycle.ts ve observability.ts var."`

`[README.md / Cognito grupları] — README.md şunu söylüyor: "Groups (owner/admin/user)" ve "Three user groups with role precedence" — kodda gördüğüm: "infra/cognito.ts dokuz grup tanımlıyor: owner, admin, user, supplier, purchasing, sales, sales_director, customer, content_editor."`

`[README.md / Admin API route tablosu] — README.md şunu söylüyor: "API Routes" altında Users/Categories/Colors/Suppliers/Products/Product Variants/Product Variant Suppliers/Measurement Types/Product Measurements/Materials/Assets listeleniyor — kodda gördüğüm: "infra/AdminApi.ts içinde 106 route var; customers, company-contacts, orders, approval-requests, web-requests, product-attributes, product-attribute-values ve industrial-usage-assignments gibi ek yüzeyler tabloda yok."`

`[README.md / RDS Proxy] — README.md şunu söylüyor: "infra/db.ts | VPC, RDS Postgres (with RDS Proxy), Prisma DevCommand" — kodda gördüğüm: "infra/db.ts içinde proxy: isProd; RDS Proxy yalnızca prod stage için açık görünüyor."`

`[AGENTS.md / Infra dosya adı] — AGENTS.md şunu söylüyor: "infra/approvalWorkflow.ts" — kodda gördüğüm: "infra/approvalWorkflow.ts yok; aktif workflow wiring sst.config.ts tarafından import edilen infra/businessWorkflow.ts içinde."`

`[AGENTS.md / Workflow isimlendirmesi] — AGENTS.md şunu söylüyor: "workflow-specific folders like SupplierApprovalWorkflow" — kodda gördüğüm: "packages/functions/src/SupplierApprovalWorkflow klasörü hâlâ var; ancak aktif state machine ve bus wiring infra/businessWorkflow.ts + packages/functions/src/BusinessWorkflow üzerinden generic BusinessRequest motoruna bağlı."`

`[ARCHITECTURE.md / Role flags] — ARCHITECTURE.md şunu söylüyor: "Derived booleans currently include: isOwner, isAdmin, isSupplier, isPurchasing, isSales, isCustomer, isContentEditor" — kodda gördüğüm: "authMiddleware.ts ayrıca isSalesDirector üretiyor ve permission kontrollerinde sales_director kullanılıyor."`

`[ARCHITECTURE.md / Supplier assignment] — ARCHITECTURE.md şunu söylüyor: "the schema still keeps a single assignedPurchasingUserId on Supplier" ve "Supplier.assignedPurchasingUserId" — kodda gördüğüm: "schema.prisma içinde Supplier.assignedPurchasingUserId yok; Supplier.assignedPurchasingSuppliers User[] ve User.assignedPurchasingSuppliers Supplier[] relation'ı var."`

`[AGENTS.md / Response validation genelliği] — AGENTS.md şunu söylüyor: "validators/ holds request/response validation" ve middleware stack içinde "response validation" — kodda gördüğüm: "lambdaHandler responseValidator'ı opsiyonel alıyor; örnek olarak AdminApi categories create/delete/update responseValidator geçmiyor, businessRequests ve birçok public/CRM route ise responseValidator kullanıyor."`

`[ARCHITECTURE.md / Response validation kapsamı] — ARCHITECTURE.md şunu söylüyor: "Response validation is actively used in parts of the backend" — kodda gördüğüm: "bu ifade doğru; ancak kapsam tüm handler'lar değil, dosya bazında değişiyor. Yeni endpointlerde hangi validator'ın beklendiği ayrıca doğrulanmalı."`

`[README.md / Public frontend package görünürlüğü] — README.md şunu söylüyor: "packages/functions/ Lambda handler functions (AdminApi, PublicApi, Cognito triggers, etc.)" ve paket listesinde frontend yok — kodda gördüğüm: "Next.js uygulaması packages/frontend altında ana runtime olarak mevcut; app router, feature modülleri, mqtt dependency ve admin/satış notification shell burada."`
