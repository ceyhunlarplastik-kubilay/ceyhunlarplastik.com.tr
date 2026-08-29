# AGENTS.md

## Purpose
This file defines the engineering rules and architectural expectations for AI agents and contributors working in this monorepo.

The goal is to preserve the current modular structure, keep the codebase scalable, and ensure new work follows the same patterns already used in the project.

## Stack
Sürümler `package.json`'dan doğrulanmıştır; tahmin etme, gerektiğinde tekrar bak.

- **SST v4** (kurulu: 4.17.x) — "Ion v3" ARTIK GEÇERLİ DEĞİL
- AWS Lambda + ApiGatewayV2
- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7 + PostgreSQL (prod: RDS, non-prod: Neon)
- shadcn/ui (Radix tabanlı, `packages/frontend/components/ui`)
- motion/react 12
- lucide-react
- TanStack Query 5 · TanStack Table 8
- Zod 4
- React Hook Form 7
- nuqs 2
- Zustand 5

## Monorepo Layout

### Root
- `sst.config.ts`
  Infrastructure entrypoint. Loads infra modules and defines stage-aware app behavior.
- `infra/`
  SST infrastructure modules.
- `packages/`
  Application packages.

### Infrastructure
- `infra/PublicApi.ts`
- `infra/ProtectedApi.ts`
- `infra/AdminApi.ts`
- `infra/OwnerApi.ts`
- `infra/frontend.ts`
- `infra/db.ts`
- `infra/cognito.ts`
- `infra/storage.ts`
- `infra/router.ts`
- `infra/cors.ts`
- `infra/apiLimits.ts` (sınır-başına throttle + reserved concurrency; tek kaynak, env ile ezilir)
- `infra/businessWorkflow.ts` (eski adı `approvalWorkflow.ts` DEĞİL)
- `infra/userAccessLifecycle.ts`
- `infra/observability.ts`
- `infra/googleMaps.ts`
- `infra/lambdaNaming.ts`

Infra files should stay focused on wiring resources, links, permissions, domains, and runtime config. Business logic must not be implemented here.

### Packages
- `packages/frontend`
  Next.js frontend application.
- `packages/functions`
  Lambda handlers grouped by API boundary and workflow.
- `packages/core`
  Shared backend/core logic, Prisma access, middleware, helpers, validation, and domain utilities.
- `packages/scripts`
  Internal scripts and utilities.

## Architectural Principles

### 1. Preserve the existing modular structure
Do not flatten the repository.
Follow the current split:
- infra wiring in `infra/`
- backend request entrypoints in `packages/functions`
- shared backend/core logic in `packages/core`
- UI and feature modules in `packages/frontend`

### 2. Prefer feature-based organization
Inside `packages/frontend/features`, keep code grouped by domain:
- `api/`
- `components/`
- `hooks/`
- `server/`
- `schema/` when needed

Do not move feature-specific code into global folders unless it is genuinely shared across multiple features.

### 3. Keep pages thin
Next.js `app/**/page.tsx` files should stay small and mostly compose feature components.
Avoid large page files with embedded business logic, query orchestration, and UI state.

### 4. Reuse before adding
Before creating new helpers, hooks, or components, check whether an existing feature or core utility already solves the same problem.

### 5. Prefer explicit data flow
Keep data flow readable:
- page/layout composes
- feature hooks fetch/mutate
- API files encapsulate HTTP
- backend handlers orchestrate dependencies
- repositories and shared helpers perform data/domain logic

## Frontend Rules

### Server Components by default
Use Server Components by default in `packages/frontend/app`.
Add `"use client"` only when one of the following is required:
- browser-only APIs
- event handlers
- local interactive state
- TanStack Query client hooks
- React Hook Form
- motion/react animations
- Zustand store access
- nuqs client query-state hooks

### SSR and SEO
Public, SEO-critical pages should remain server-rendered whenever possible.
Do not convert public marketing or catalog pages to client-heavy rendering unless there is a clear requirement.

Use client components as leaf nodes inside server-rendered routes when interactivity is needed.

### Data fetching
- Use TanStack Query for async client-side server state.
- Prefer server-side fetching for SEO-critical content and first-load public pages when practical.
- Keep query keys stable and descriptive.
- Avoid ad hoc fetch logic directly inside large components.

### Performance
- Prefer memoization only when the benefit is clear.
- Avoid premature optimization.
- Prefer server-side data fetching for large public datasets when SSR/SEO matters.
- Avoid unnecessary client-side hydration.
- Prefer client islands over turning entire routes into client components.

### URL query state
Use `nuqs` for query-string state such as:
- filters
- pagination
- sorting
- view mode
- refresh interval

Do not manually manage shareable filter state with scattered `useState` + router string building when `nuqs` is more appropriate.

### Forms
Use:
- `zod` for schema validation
- `react-hook-form` for form state
- `@hookform/resolvers/zod` for integration

Validation rules should be centralized in a schema, not duplicated across inputs.

### UI components
- Prefer `shadcn/ui` primitives from `packages/frontend/components/ui`
- Prefer reusable feature components over one-off page-local markup
- Prefer `lucide-react` for icons
- Prefer `motion/react` for animations
- Prefer consistent badges, dialogs, selects, inputs, and table primitives already present in the repo

Do not introduce custom visual primitives if an equivalent shadcn/ui component already exists.

### Accessibility
- Prefer accessible Radix/shadcn primitives.
- Preserve keyboard navigation and focus states.
- Use semantic HTML.
- Do not break dialog, table, select, accordion, or form accessibility when refactoring.

### State management
Avoid unnecessary `useState`.

Use:
- derived state with `useMemo` when appropriate
- extracted hooks for reusable stateful logic
- `useReducer` for complex UI state
- Zustand only for shared client state that truly benefits from a store

Examples of state that should usually not live in multiple local `useState` variables:
- multi-control filter toolbars
- expandable row UI with per-row notes
- wizard-like forms
- coupled modal/workflow state

### Component size
If a client component starts handling multiple responsibilities, split it into smaller parts such as:
- toolbar/filter bar
- table/list
- row detail panel
- pagination
- dialog/form

For multi-flow feature surfaces such as request composers or workflow creation screens:
- keep the container/orchestrator in one file
- move type-specific UI into smaller internal feature components
- do not keep large render trees for unrelated flows inside a single client component

### Admin list surfaces — reuse, do not rebuild
Operasyonel listelerde (arama + filtre + sayfalama + yenileme) HER ZAMAN mevcut
parçalar kullanılır:
- `features/admin/shared/components/AdminListPagination.tsx` — numaralı sayfalama
  (`Önceki 1 … 5 [6] 7 … 20 Sonraki`) + sayfa boyutu. Numara dizilimi saf ve testli:
  `features/admin/shared/utils/buildPaginationRange.ts`.
- `features/admin/shared/components/AdminListRefreshBar.tsx` — son güncelleme saati,
  elle yenile düğmesi ve otomatik yenileme aralığı.
- `features/admin/shared/components/AdminSectionLoadingOverlay.tsx` — arka plan
  yenilemesi için bölüm-yerel katman (aşağıdaki refetch-feedback deseninin 2. adımı).

Bu bileşenlere ihtiyaç duyulan bir davranış eksikse, paralel bir kopya yazmak yerine
ORTAK bileşeni genişlet: tüm admin listeleri aynı davranışı kazanmalı.

**Filtrelemeyi nereye koymalı:** liste zaten tek bir üst kaydın (ör. bir ürün modelinin)
tüm satırlarını çekiyorsa filtre + sayfalama İSTEMCİDE yapılır ve saf, testli bir
yardımcıya çıkarılır (`filterVariantRows` örneği). Sunucuya sayfalanan büyük listelerde
ise filtre query parametresi olarak gider. Her iki durumda da durum `nuqs` ile URL'de
tutulur — ekran paylaşılabilir ve geri tuşu filtreyi korur.

### Tables
- Prefer simple table composition for small static tables.
- Prefer TanStack Table for complex operational tables with evolving requirements such as sorting, filtering, expansion, visibility control, or column-level behaviors.
- Keep row rendering components isolated when table complexity grows.
- Avoid burying table orchestration, filters, and row details inside a single large page component.
- When introducing TanStack Table to an existing large operational page, migrate incrementally through an isolated feature table component and preserve existing row edit/detail behavior during the pilot.

## Backend Rules

### Entry points
Lambda entrypoints live in `packages/functions/src/**`.
Group them by execution boundary:
- `PublicApi`
- `ProtectedApi`
- `AdminApi`
- `OwnerApi`
- workflow-specific folders like `BusinessWorkflow` (the generic `BusinessRequest` engine; the older `SupplierApprovalWorkflow/` folder is legacy and no longer the active wiring)

### Actions pattern
Follow the existing pattern:
- `actions.ts` exports lambda-wrapped handlers
- `handlers/` contains request handlers
- `types/` defines event/dependency contracts
- `validators/` holds request/response validation

Do not embed large business logic directly inside `actions.ts`.

### Lambda middleware
Use the shared `lambdaHandler` from `packages/core/src/core/middy.ts`.
Keep using the repo’s existing middleware stack:
- parsing
- request validation
- auth
- response validation
- logging
- error handling

### Validation
Use Zod-based validators consistently for:
- request payloads
- response payloads where the project already validates responses

Keep validation close to the API boundary.

`lambdaHandler`'s `responseValidator` is **optional and wired per handler** — not every
endpoint has one. When adding or changing an endpoint, check what that specific
`actions.ts` wires, and keep the response schema in sync with the handler's real
output: TypeScript will not catch drift between them, but the running endpoint will
500 with "Response object failed validation".

### Error handling
- Use typed error responses and consistent backend error shapes.
- Use `http-errors` and the existing middleware/error pipeline for Lambda handlers.
- Use `Sonner` for user-facing notifications in the frontend.
- Do not leak raw infrastructure or database errors directly to users.

### Dependency injection
Prefer the existing dependency construction pattern:
- build deps in `actions.ts`
- pass them into handler factories

This keeps handlers testable and composable.

## Core Layer Rules

### `packages/core` ownership
`packages/core` is the place for shared backend logic:
- Prisma client setup
- repositories
- middleware
- domain helpers
- shared validation wrappers
- pricing and approval logic

If logic is reused across handlers or workflows, it belongs here.

### Repositories
Repositories should encapsulate Prisma access and query details.
Do not duplicate Prisma query shapes across multiple handlers if a repository abstraction already exists.

### Domain helpers
Shared calculation or workflow logic must be centralized in helpers.
Examples:
- pricing computation
- approval resolution
- payload normalization

Avoid copy-pasting pricing or transformation logic across multiple handlers.

### Existing project conventions
Respect these existing conventions before introducing alternatives:
- `lambdaHandler` for Lambda middleware composition
- `apiResponseDTO` for API response envelopes
- repository pattern for Prisma access
- shared mapping helpers such as `mapProductWithAssets`
- auth-derived role flags and user capability checks such as `isOwner`, `isAdmin`, `isSupplier`, `isPurchasing`, `isSales`, `isContentEditor`

When adding new backend functionality, first ask whether it belongs in:
- a repository
- a shared domain helper
- a mapper/transformer
- a Lambda handler

Do not skip the established helper/repository layers just because a handler can technically do the work inline.

When extending customer-to-product profile matching:
- keep dictionary ownership in `ProductAttribute` / `ProductAttributeValue`
- do not create a duplicate customer-specific attribute dictionary unless explicitly requested
- customer assignability should be driven by attribute metadata such as `isCustomerAssignable`, not by scattered UI allowlists
- treat `sector`, `production_group`, and `usage_area` as system customer-profile attributes; they are customer-assignable by default and should not depend on an editable checkbox
- keep product matching logic in repository/service helpers, not in UI components
- matching is BIDIRECTIONAL and both directions must come from `customerProfileMatching.ts`:
  `buildCustomerProfileProductWhereClauses` (customer → products, portal "İlgili Ürünler")
  and `collectProductProfileReach` + `buildProductProfileCustomerWhereClauses`
  (product → customers, sales panel "Müşteriler"). The forward rule checks the attribute
  code only on the branches that CLIMB the hierarchy; the inverse must mirror that exactly,
  or the two screens contradict each other without erroring. `customerProfileMatching.test.ts`
  locks the symmetry
- treat “customer profilinde seçilebilir” and “ürün eşleştirmede kullanılır” as separate concerns so future customer attributes do not accidentally change matching behavior
- keep category-scoped product filters and industrial usage taxonomy separate
- `model_type`, `connection_type`, `profile_type`, `material_type`, `usage_type`, and `hat_type` stay on `Product.attributeValues` and may be constrained by `Category.allowedAttributeValueIds`
- `sector`, `production_group`, and `usage_area` stay in the shared dictionary but must be assigned to products through `ProductIndustrialUsage`, not through `Product.attributeValues`
- product-specific usage descriptions belong on `ProductIndustrialUsage.usageFunction`, not in `ProductAttributeValue`

When touching product variants or their codes:
- Varyant kodu (`10.5.8.V1` ve tedarikçili `10.5.8.V1.A`) TEK KAYNAKTAN üretilir:
  `core/helpers/productVariants/`. Kod şablonunu handler içinde string template ile
  YENİDEN KURMA — eski sistemde dört ayrı kopya vardı ve sessizce ayrıştılar.
- Versiyonda KOD ile KOMBİNASYON ayrı şeylerdir: `fullCode` (`10.5.8.V1`) içinde
  renk/hammadde geçmez, yalnız NUMARA geçer. Numara değiştirilemez (tüm kodları
  yeniden yazmak gerekir); renk/hammadde `PATCH` ile düzenlenebilir ve hiçbir kodu
  bozmaz — veri girişi hatası varyant silmeden düzeltilebilsin diye.
- Versiyon (`V1` = renk + hammadde) ÜRÜN MODELİ BAŞINA tanımlıdır ve ÖNCE TANIMLANIR:
  `productVariantWriter` sözlükte olmayan bir kombinasyonu otomatik EKLEMEZ, satırı
  reddeder. Numara append-only'dur; mevcut bir kaydın kodunu değiştiren uç bilinçli
  olarak yoktur (o kombinasyonu kullanan tüm varyantların `fullCode`'unu yeniden
  yazmak gerekirdi). Ölçünün aksine versiyonun sıralanması için iş kuralı YOK —
  1..N yeniden numaralandırma geri getirilmemeli: dışarı çıkmış kodları (katalog,
  teklif, tedarikçi siparişi) yanlış varyanta işaret eder hâle getiriyordu.
- `ProductVariant` = ürün + ölçü + versiyon. Tedarikçi varyantın parçası DEĞİLDİR;
  `ProductVariantSupplier` üzerinde yaşar ve tedarikçili tam kodu oradadır.
- Ölçü kodu (3. segment) APPEND-ONLY'dir: yeni ölçü sıradaki numarayı alır, kod ile
  ölçünün BÜYÜKLÜĞÜ arasında bağ YOKTUR (`10.11.3` ölçüsü `10.11.1`'den küçük
  olabilir). Eski "taslak" kipi her kayıtta 1..N yeniden numaralıyordu; kaldırıldı.
  **SIRALAMA AYRI EKSEN**: listeler `ProductSize.sortKey` ile küçükten büyüğe sıralar
  (`@@index([productId, sortKey])`). Koda göre sıralayan her yer SESSİZCE bozulur —
  hata vermez, yalnız yanlış sıra gösterir.
- Tedarikçi harfi (5. segment) ÜRÜN MODELİNE ÖZELDİR: `1.2.3.V1.A` Özgen iken
  `10.11.2.V1.A` Aparat Toptan olabilir. Versiyon sözlüğüyle aynı desen: HARF sabit
  (değiştirmek tüm kodları yeniden yazar), TEDARİKÇİ ataması düzenlenebilir.
- Ölçü tekilleştirme anahtarı **ölçü imzası + TEDARİKÇİ**'dir: aynı fiziksel ölçü
  farklı tedarikçilerden girilirse her giriş KENDİ kodunu alır (`4.1.1` Özgen,
  `4.1.7` Esersan) — kod, veri girişi sırasının sayacıdır. Aynı tedarikçi aynı
  ölçüyü tekrar girerse yeni kod ÜRETİLMEZ, mevcut satır güncellenir. Kontrol
  UYGULAMA katmanındadır (`productVariantWriter`), DB kısıtı değil: tedarikçi
  `ProductSize` üzerinde değil `ProductVariantSupplier` üzerinde yaşıyor.
  Public/portal listeleri ölçüleri gruplayıp tekilleştirdiği için müşteriye aynı
  ölçü iki kez görünmez.
- Ölçü kodunun sırası ürün modelinin ölçü ŞABLONUNDAN (`ProductMeasurementRequirement`)
  türer. Şablon değişirse `recalculateProductVariantCodes` çağrılmalı; yoksa `sortKey`
  bayatlar ve "küçükten büyüğe" kuralı sessizce bozulur.
- Kod yazan her yol `assignProductVariantCodes` (saf plan) → `writeProductVariantCodes`
  (iki fazlı yazma) zincirinden geçer. Unique index Postgres'te ertelenemediği için
  güncellenecek satırların kodları önce "park edilir"; bu fazı atlama.
- Ölçü/renk/hammadde/tedarikçi kimliği düzenleme yüzeylerinde DEĞİŞTİRİLEMEZ olmalı —
  varyantın kodunu belirlerler; değişim satırı silip yeniden girmeyi gerektirir.

When extending the content-entry (`content_editor`) workspace toward CRM data:
- keep `content_editor` out of `/customers` endpoints; those carry commercial fields (discount,
  credit limit, payment terms, sales rep) and the LEAD↔CUSTOMER conversion
- expose narrow, purpose-built endpoints instead (`/lead-customers`) whose request schema does not
  declare commercial fields or `status` at all, and which only ever touch `status: LEAD` records
- reuse the shared core layer (`customerRepository`, `resolveCustomerAttributeAssignments`,
  `customerProfileMatching`) rather than reimplementing validation or matching rules
- customer→product profile matching rules live in `core/helpers/crm/customerProfileMatching.ts`
  and must stay the single source for both the customer portal and any admin preview surface
- a customer's `sectorValueId` / `productionGroupValueId` is a single primary classification, while
  `usageAreaValues` is a multi-valued interest list that MAY span other sectors; do not reintroduce
  a "usage_area must belong to the selected sector/production group" constraint
- reuse `CustomerAddressFormDialog` (map picker + geo fields included) and the shared
  `core/helpers/crm/customerAddressInput.ts` normalizer for any new address surface

`content_editor`'a bir yüzey açarken (CRM dışında da geçerli):
- Mevcut bir admin ucunun yetkisini GENİŞLETMEDEN önce ne döndürdüğüne bak. Örnek:
  `/product-variants/references` tedarikçileri ham satır olarak döndürüyor (vergi
  numarası, adres, telefon, varsayılan vade) — operatörün bunlara ihtiyacı yok.
  Doğrusu dar, amaca özel bir uçtu: `/product-variant-matrix/references` yalnız
  id + ad taşır.
- Ticari/marj alanları (`operationalCostRate`, `netCost`, `profitRate`, `listPrice`)
  operatöre kapalıdır: yanıtta dönmez, istekte gelirse sessizce düşürülür. Kural tek
  yerde ve testli: `core/helpers/productVariants/supplierFieldVisibility.ts`.
  Buna karşılık `price` (tedarikçinin BİZE fiyatı) katalog verisidir ve operatör girer.

When extending customer portal contact surfaces:
- keep external customer-side portal/contact users as `User` records linked by `User.customerId`
- keep Ceyhunlar department contact points as `CompanyContact` display records, not login accounts or roles
- assign Ceyhunlar contacts to customers through `CustomerCompanyContactAssignment`
- preserve `assignedSalesUser` as the primary sales representative and render company contacts as additional department contact points
- portal responses should hide inactive company contacts or inactive assignments, while admin/sales management surfaces may show them for maintenance

When extending customer-specific special prices:
- store customer-specific variant prices separately from `ProductVariantSupplier` supplier/list pricing
- special prices may include minimum/maximum order quantity, payment term, validity period, tax information, delivery terms, contract reference, and customer/internal notes
- multi-step payment terms such as `%50 peşin + %50 30 gün` should be stored as structured `paymentSchedule` data on the special price while preserving legacy `paymentTermDays` / `paymentTermLabel` for simple terms and display fallback
- special prices override `Customer.generalDiscountPercent` only for the selected customer + product variant when active, current, and quantity-eligible
- special prices must never mutate `ProductVariantSupplier.listPrice`, supplier cost, operational cost, net cost, or profit calculations
- customer portal responses must only expose the authenticated customer's own active/current special prices and must not expose internal notes
- order/request creation should snapshot the resolved price source and commercial terms at creation time so later special-price edits do not rewrite historical orders or requests
- keep special-price UI helpers, formatting, form mapping, and larger cards in feature-local `specialPrices` utilities/components instead of crowding page client files

## Database Rules

### Prisma
- Schema lives in `packages/core/prisma/schema.prisma`
- Generated client is consumed from `packages/core/prisma/generated`
- Shared Prisma client setup is in `packages/core/src/core/db/prisma.ts`

### Migrations
When schema changes are required:
- update the Prisma schema
- keep model naming and relation naming consistent with existing conventions
- do not create speculative schema changes unrelated to the task

If a migration must be run manually by the user, clearly state the command instead of assuming it has been executed.

### Data conventions
Preserve existing naming and domain terminology:
- `BusinessRequest`
- `ProductVariantSupplier`
- role-oriented API boundaries
- soft-delete behavior where already implemented

### Reference geo data
When implementing selectable address flows for customers or suppliers:
- Treat country/state/city data as internal reference data stored in the project PostgreSQL database, not as a runtime dependency on a third-party API.
- Prefer additive schema changes. Keep display strings such as `country`, `city`, `district`, and `postalCode` while introducing normalized foreign keys like `countryId`, `stateId`, and `cityId`.
- Import upstream location data through project-owned scripts under `packages/core/prisma/`, not by relying on temporary clone directories or one-off SQL imports.
- Expose shared geo lookups through `PublicApi` so public, admin, customer, and future supplier forms can reuse the same selector contract.
- Do not assume the global dataset includes reliable mahalle/neighborhood coverage; keep fine-grained local address parts as editable text unless a country-specific source is intentionally added.

## Infrastructure Rules

### SST
Use the SST **v4** patterns already present in the repo.

Infra files should:
- define resources
- wire links
- configure routes
- configure runtime environment
- keep stage-aware behavior explicit

Do not move business logic into infra modules.

### APIs
Respect the current API segmentation:
- public routes in `PublicApi`
- authenticated business-user routes in `ProtectedApi`
- internal/admin routes in `AdminApi`
- owner-specific routes in `OwnerApi`

New endpoints should be added to the correct boundary, not whichever file is most convenient.

### Workflows and events
For approval and async workflows:
- keep orchestration in Step Functions/EventBridge-aware modules
- keep domain updates in shared helpers or handlers
- avoid coupling business truth to transient UI polling behavior
- for AWS IoT/SST Realtime topics, always prefix with app and stage, authorize subscribe access per user topic, and keep browser clients publish-denied unless a feature explicitly requires client publishing

For user access lifecycle and notifications:
- prefer `Bus + Realtime + SES` style fan-out for role/access change notifications
- keep Cognito group changes, DB access-status changes, and event publication coordinated through a shared domain helper
- do not scatter Cognito group mutation logic across multiple handlers

### Access lifecycle
- Treat the application database as the normalized source of truth for user access state after Cognito authentication succeeds.
- The default `user` group is a no-panel role and should not grant admin/protected workspace access.
- `content_editor` is an internal data-entry role with its own `/veri-girisi` workspace for category, product, and product attribute taxonomy content; do not grant it broad `/admin` panel access unless explicitly requested.
- Access lifecycle should use explicit statuses such as `PENDING_REVIEW`, `ACTIVE`, `SUSPENDED`, and `REJECTED` when the feature is involved.
- Pending or inactive users should be routed to a dedicated account-status surface such as `/hesabim`, not dropped into privileged panels.
- If signup/confirm flows change, keep the post-confirmation DB user creation and pending-review experience aligned with frontend auth messaging.

## Naming and Conventions

### File naming
Preserve the current naming style:
- page components: `page.tsx`
- feature components: `PascalCase.tsx`
- hooks: `useSomething.ts`
- API modules: verb-driven names like `getX.ts`, `updateX.ts`
- handlers: `somethingHandler.ts`
- actions entrypoints: `actions.ts`

### TypeScript
- Prefer explicit types for public APIs and cross-layer contracts
- Reuse domain types where possible
- Keep types close to the feature or backend boundary they describe

### Imports
Prefer existing alias usage like `@/…` where already configured.
Do not introduce inconsistent relative import patterns inside the same area.

## React and Next.js Guidance

### Prefer modern patterns
Use current React/Next.js practices appropriate for this repo:
- Server Components by default
- client islands for interactivity
- extracted hooks for complex behavior
- URL state via `nuqs`
- cache-aware data fetching patterns

### Avoid anti-patterns
Avoid:
- large monolithic client pages
- duplicated async logic across components
- manually syncing URL state without `nuqs`
- duplicated validation logic
- duplicated calculation logic
- overusing local state for derived or shareable state

## UI/UX Guidance

### Admin and protected interfaces
Protected/admin UIs should feel operational and efficient:
- clear status badges
- visible refresh behavior
- reusable filters/toolbars
- tables split from orchestration logic
- review and approval screens should emphasize changed values first instead of dumping full before/after records

Customer portal operational chrome should follow the same principle:
- persistent cart or workflow state should live in layout/topbar/mobile chrome when it needs continuous visibility
- avoid random floating overlays when the same state can be integrated into the panel shell more cleanly

For filter/search/sort/pagination interactions that trigger client-side refetching:
- always provide localized loading feedback near the affected content area
- prefer skeletons or subtle section overlays instead of full-page blocking spinners
- preserve previous content during background refetch when possible
- avoid layout shift and keep surrounding filters, headers, and context stable
- reuse existing shadcn/ui, Tailwind, and motion/react patterns before adding packages

**Established refetch-feedback pattern (reuse it, do not reinvent):**
1. **First load** (`isLoading`, no content yet) → a skeleton that matches the final layout
   (`ProductGridSkeleton`, `CustomerPortalProductGridSkeleton`).
2. **Background refetch** (`isFetching` with previous data) → keep the old content on screen and
   put a **section-local** overlay on top of the list container:
   `features/public/products/components/ProductListLoadingOverlay.tsx` (public) /
   `CustomerPortalProductsLoadingOverlay` (portal). Requirements: `relative` wrapper +
   `absolute inset-0` overlay, `pointer-events-none`, `role="status"` + `aria-live="polite"`,
   `aria-busy` on the wrapper, `<AnimatePresence>` for enter/exit, and `useReducedMotion()`.
   Pair it with `placeholderData: (prev) => prev` on the query so content never blanks out.
3. **Control-side feedback** → the control that triggered it also reflects pending state
   (e.g. `ProductFilterSidebar`'s `isPending` spinner + "filtering/ready" line).
4. **Never** use a page-level `fixed` progress bar for a section-level refetch — that slot
   belongs to route navigation (`NavigationProgress`), and two bars in the same place collide.
5. Keep active-filter chips visible in the empty state so the user can undo the filter that
   produced zero results.

**Route navigation** (clicking a link, not refetching in place) is a different concern:
`loading.tsx` per route for the skeleton, `template.tsx` for the transition animation, and the
global `NavigationProgress` indicator for immediate click feedback above the navbar/dropdown.

### Animations
Use `motion/react` sparingly and intentionally:
- feedback for refresh/loading
- subtle reveal/transition states
- no decorative motion that harms clarity

For client-side route transitions triggered from a focused module such as a table, grid, or detail CTA:
- prefer localized pending feedback near the initiating control or affected section
- avoid full-page blocking spinners when surrounding context can remain stable
- keep the clicked context visible long enough for the user to understand what is opening

## Change Strategy

When implementing new work:
1. Identify the correct package and feature boundary first.
2. Reuse existing patterns from nearby code.
3. Extract shared logic instead of duplicating it.
4. Keep page files thin.
5. Keep API entrypoints thin.
6. Preserve SSR for public SEO-sensitive routes.
7. Use the agreed libraries for each concern.

## Preferred Patterns by Concern
- Async client server state: TanStack Query
- URL query state: nuqs
- Form state + validation: React Hook Form + Zod
- Icons: lucide-react
- Animation: motion/react
- Shared client state: Zustand only when truly shared
- API validation: Zod
- Backend request orchestration: handler factory + deps pattern
- Shared domain logic: `packages/core`
- Reusable UI primitives: shadcn/ui
- i18n / localization: next-intl (catalogs in `packages/frontend/messages/*.json`, one namespace per page/feature; see `.claude/skills/i18n-migrate` and ARCHITECTURE.md § Internationalization)
- Structured logging: AWS Lambda Powertools logger via the shared Middy pipeline

## What Not To Do
- Do not replace the feature-based structure with a flat folder layout.
- Do not move SEO-critical public pages to unnecessary client rendering.
- Do not put business logic directly into page files or infra files.
- Do not duplicate pricing or transformation logic across multiple handlers.
- Do not add large uncontrolled local state trees when a reducer or extracted hook is cleaner.
- Do not introduce new UI libraries for patterns already covered by shadcn/ui.
- Do not bypass Zod for complex form or request validation.
- Do not add one-off fetch patterns when TanStack Query is the established solution.

## Definition of Done
A change is considered aligned with this architecture when:
- it fits the correct package and feature boundary
- page files remain thin
- reusable logic is extracted
- public SSR concerns are preserved
- the correct state/data tools are used
- naming and folder conventions stay consistent
- the result is understandable, maintainable, and scalable

## Documentation Strategy
- `AGENTS.md` should remain the high-level implementation guide and engineering rulebook.
- If deeper project-specific system design documentation is needed, create `ARCHITECTURE.md` as a separate document.
- Keep `AGENTS.md` concise enough to guide implementation decisions, and keep lower-level flow diagrams, subsystem notes, and internal conventions in `ARCHITECTURE.md`.
- Update `ARCHITECTURE.md` in the same change when routing, auth, workflows, role boundaries, or shared domain structure materially changes.
- Update `AGENTS.md` in the same change when a reusable implementation rule or UI decision should guide future work.
