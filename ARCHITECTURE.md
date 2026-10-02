# ARCHITECTURE.md

## Purpose
This document explains the current technical architecture of the `ceyhunlarweb` monorepo.

Use this file for project-specific system design, boundaries, request flows, and extension points.
Use `AGENTS.md` for general engineering rules and implementation conventions.

This is a living document. Keep it aligned with the actual codebase instead of treating it as an aspirational design.

## System Overview
The system is a monorepo built around SST v4 on AWS.

High-level responsibilities:
- `infra/` defines cloud resources and connects services.
- `packages/frontend` contains the Next.js App Router application.
- `packages/functions` contains Lambda entrypoints grouped by API boundary and workflow.
- `packages/core` contains shared backend logic, Prisma access, middleware, repositories, and domain helpers.
- `packages/scripts` contains internal tooling and utility scripts.

At runtime, the system is primarily composed of:
- a Next.js frontend deployed through SST
- multiple API Gateway v2 HTTP APIs backed by Lambda
- Cognito for authentication
- PostgreSQL through Prisma: AWS RDS in production, Neon Postgres in non-production stages
- S3 for public assets
- EventBridge + Step Functions for human approval workflow orchestration
- SST Realtime / AWS IoT for browser-visible realtime notification delivery
- domain-level event buses for access lifecycle and business request workflows

## Monorepo Boundaries

### `infra/`
Infrastructure files are the composition root of the system.

Key modules:
- `sst.config.ts`
  Main SST entrypoint. Loads the infra modules and defines stage behavior.
- `infra/db.ts`
  Stage-aware database wiring. Production creates the VPC and AWS RDS Postgres resources; non-production stages link Neon connection strings through SST secrets.
- `infra/cognito.ts`
  Cognito User Pool, app client, groups, custom auth support, and legacy hosted UI domain wiring.
- `infra/storage.ts`
  S3/public asset resources.
- `infra/router.ts`
  Router and domain wiring for permanent stages.
- `infra/frontend.ts`
  Next.js deployment and runtime environment injection.
- `infra/PublicApi.ts`
- `infra/ProtectedApi.ts`
- `infra/AdminApi.ts`
- `infra/OwnerApi.ts`
  API Gateway boundaries and Lambda route wiring.
- `infra/businessWorkflow.ts`
  Generic Step Functions + EventBridge business request workflow resources.
- `infra/userAccessLifecycle.ts`
  User access lifecycle bus, realtime authorizer/subscribers, and email notification fan-out.
- `infra/apiLimits.ts`
  Per-boundary API Gateway throttle values and Lambda reserved-concurrency values (single source, env-overridable, concurrency reservations `prod`-only).
- `infra/cors.ts`
  Stage-aware CORS origin allowlist applied to all four API boundaries.
- `infra/observability.ts`
  `prod`-only SNS alarm topic + email subscription and CloudWatch alarms (account concurrency, Lambda throttles, p95 duration, 6MB response-payload log-metric).
- `infra/googleMaps.ts`
  Google Maps / Places API keys (browser + server) and Map ID as SST secrets, plus the `prod`-only coordinate-refresh cron.
- `infra/lambdaNaming.ts`
  Deterministic searchable physical names for API-route Lambdas.

Infra files should only wire resources, permissions, links, domains, and runtime configuration.
Business logic belongs in `packages/functions` or `packages/core`.

### `packages/frontend`
This is the user-facing and backoffice web application.

Main architecture choices:
- Next.js App Router
- Server Components by default
- Client components only where interactivity is required
- Feature-based module structure under `features/`
- TanStack Query for async server state
- TanStack Table may be introduced incrementally for complex operational admin tables, but existing row edit/detail flows should remain isolated in feature components during migration
- `nuqs` for URL query state
- `shadcn/ui` primitives for UI consistency

### Loading and refetch UX
Data-heavy screens such as lists, grids, tables, and filtered result pages should distinguish between initial loading and background refetch states.

Expected behavior:
- initial loading should use skeleton grids, skeleton tables, or placeholder content that preserves the expected layout
- background refetch triggered by filters, search, sorting, pagination, tabs, or query changes should keep the current layout stable whenever possible
- avoid full-page blocking loaders for localized data refresh
- prefer localized content-region feedback such as subtle overlays, shimmer cards, skeleton rows, or inline status indicators
- headers, filters, navigation, and surrounding context should remain visible during refetch unless the route truly changes
- loading components should stay feature-local unless the same interaction pattern is reused across multiple modules
- loading states should include accessible feedback such as `aria-busy`, `aria-live`, or screen-reader-only status text

Current reference pattern:
- customer portal product listing uses an initial skeleton grid for first load
- filter-driven refetch keeps existing product cards rendered and applies a subtle grid overlay/loading state only over the affected listing region

Related route-transition pattern:
- when a user triggers a client-side navigation from a focused list, table, or detail module, prefer localized pending feedback near that module instead of replacing the full route shell immediately
- clicked CTA states, compact overlays, or section-level transition indicators are preferred when the destination is a deeper detail flow and the current context still helps orientation

### `packages/functions`
This package contains Lambda entrypoints organized by execution boundary instead of by shared domain.

Current boundaries include:
- `PublicApi`
- `ProtectedApi`
- `AdminApi`
- `OwnerApi`
- workflow-specific folders such as `BusinessWorkflow`
- auth-related folders such as `Cognito`

This package is the API edge. It should orchestrate dependencies and delegate domain work to `packages/core`.

### `packages/core`
This package owns reusable backend logic.

Key responsibilities:
- Prisma client and database access setup
- shared Middy middleware
- repositories
- domain helpers
- DTO builders and response utilities
- mappers such as `mapProductWithAssets`
- cross-function business logic such as pricing and approval helpers

`packages/core` is the main place for logic that must stay consistent across multiple Lambda handlers.

## Infrastructure Topology

### SST entrypoint
`sst.config.ts` is the composition root for the deployed system.

Current behavior:
- app name: `ceyhunlarweb`
- home: AWS
- `prod` is protected and retained
- non-prod stages are removable
- infra modules are loaded inside `run()`

### Networking and database
`infra/db.ts` is stage-aware:

- `prod` creates the SST VPC and AWS RDS Postgres instance.
- non-production stages such as `kubi` and `dev` do not create a VPC or RDS database; they link a Neon pooled connection string as `Resource.MyPostgres.url`.
- Prisma CLI commands use `DIRECT_URL` when present, falling back to `DATABASE_URL`.
- the local Prisma Studio dev command receives both `DATABASE_URL` and `DIRECT_URL`.

Notable implementation detail:
- Lambdas linked to the production VPC do not have default public internet access.
- This matters for any future AWS public endpoint usage from inside VPC-backed functions.
- RDS Proxy is enabled in prod to protect the production database from serverless connection spikes.
- Non-production Neon runtime connections should use the pooled Neon URL; import, restore, migration, and introspection work should use the direct Neon URL.
- Prisma uses a small `pg` pool by default in non-development runtimes; raise it only with an explicit capacity review.

### Authentication
`infra/cognito.ts` defines:
- Cognito User Pool
- Cognito app client
- hosted UI domain configuration retained for compatibility and rollback
- Cognito groups:
  `owner`, `admin`, `user`, `supplier`, `purchasing`, `sales`, `sales_director`, `customer`, `content_editor`, `production_planner`
  (the name list is shared from `packages/core/src/core/helpers/userAccess/groups.ts`; a group missing there is silently dropped from the token)
- a `postConfirmation` trigger Lambda linked to the stage database

Frontend authentication is handled by NextAuth with a custom Cognito credentials flow.
Admin and protected API requests currently send the Cognito `idToken` as the bearer token.

Current auth UX behavior:
- `/auth/*` pages are custom Next.js screens
- sign-in, sign-up, confirm-sign-up, forgot-password, and reset-password flows are rendered inside the app
- Cognito API calls are made server-side from the frontend package
- the hosted UI domain still exists in infra, but it is no longer the primary user-facing auth surface
- sign-up confirmation no longer implies immediate panel access; newly confirmed users enter a pending-review state
- `/auth/awaiting-approval` is the public transition screen after confirmation
- `/hesabim` is the authenticated account-status screen for pending, suspended, or rejected users

Current user identity conventions:
- the application database stores `User.firstName` and `User.lastName` as nullable fields for backward-compatible rollout
- new sign-up flows collect `firstName` and `lastName` and send them to Cognito standard attributes `given_name`, `family_name`, and `name`
- the `identifier` column remains in place for compatibility and operational search, but UI display should prefer `firstName + lastName`
- the standard fallback order for user display text is:
  `firstName + lastName` -> `identifier` -> email local-part
- existing legacy users without populated name fields must remain able to sign in and render safely throughout admin, customer, and workflow surfaces

That token model is a real current implementation detail and should be preserved unless the auth model is intentionally changed.

### Frontend deployment
`infra/frontend.ts` deploys the Next.js app through `sst.aws.Nextjs`.

The frontend receives environment values for:
- stage
- domain
- region
- NextAuth config
- Cognito config
- public/admin/protected API base URLs
- realtime endpoint + authorizer name, the notification topic prefix and the production change topic
- asset base URL

Permanent stages are also granted a public Lambda invoke permission for the server function.

### Routing and domains
`infra/router.ts` configures routing for permanent stages such as `prod` and `dev`.

It currently:
- provisions a router with the configured domain
- maps multiple asset-like paths to the public bucket

This means domain and asset routing are infra concerns, not frontend concerns.

### API boundaries
The repo intentionally separates APIs by audience and trust level.

- `PublicApi`
  Public read or public submission endpoints.
- `ProtectedApi`
  Authenticated non-admin operations such as supplier-facing actions.
- `AdminApi`
  Admin/owner operational endpoints.
- `OwnerApi`
  Highest-privilege owner-only endpoints.

When adding a new endpoint, place it in the narrowest boundary that matches the required permissions.

### Customer CRM and portal model
Customer management distinguishes between two different product relationships:
- Customer-facing "İlgili Ürünler" list — surfaced in the portal, **derived only from
  profile matching** (customer sector / production group / usage area ↔
  `ProductIndustrialUsage`, via `customerProfileMatching.ts`). There is no manual
  human curation: admin / sales director / sales representative cannot pick these
  products. The `CustomerFeaturedProduct` model and its `PUT` endpoints were removed
  on 2026-09-08.
- `Customer.assignedProducts`
  Operational "Tanımlı Ürünler" list. These represent frequently sold or strategically defined products for that customer.

The distinction is intentional and should be preserved in future UI and API work. Do not overload one relation for both concerns.

Customer profile attribute matching now uses the same shared dictionary as products:
- `ProductAttribute` / `ProductAttributeValue` remain the single source of truth for selectable attribute metadata
- customer eligibility is controlled by attribute metadata such as `ProductAttribute.isCustomerAssignable`
- `sector`, `production_group`, and `usage_area` are system customer-profile attributes and are treated as customer-assignable even if their stored metadata flag is false
- customer assignments are stored generically through `CustomerAttributeValueAssignment`
- legacy customer fields such as `sectorValueId`, `productionGroupValueId`, and `usageAreaValues` remain in place during the transition and are dual-written from the generic assignment layer

Matching boundaries are intentionally scoped:
- generic customer assignment can support any attribute marked customer-assignable
- automatic product enrichment for `/musteri/tanimli-urunler` is currently limited to the hierarchical family `sector`, `production_group`, `usage_area`
- future customer-assignable attributes may appear in customer profile forms without affecting product matching unless matching logic is explicitly extended later
- product category-based allowed attribute value logic remains product-only and must not be reused as a customer assignment constraint

Product industrial usage is separate from normal category-scoped product filtering:
- `ProductAttribute` / `ProductAttributeValue` still own the shared taxonomy dictionary for `sector`, `production_group`, and `usage_area`
- those three taxonomy families are no longer assigned to products through `Product.attributeValues`
- product-specific industrial usage rows live in `ProductIndustrialUsage`
- `ProductIndustrialUsage` references dictionary values by field role and stores product-specific `usageFunction` text plus an optional example image key on the row

### Customer location and map surfaces
Customer location management is now split into a shared feature with role-specific routes:
- `/satis/harita`
  Sales workspace map for `sales` and `sales_director`.
- `/admin/musteriler/harita`
  Admin workspace map for `admin` and `owner`.

Route separation is a UX and layout concern only. Access control is enforced in backend handlers:
- `sales`
  May only query map points for customers assigned to `currentUser.id`.
- `sales_director`, `admin`, `owner`
  May query all customers and optionally filter by `assignedSalesUserId`.
- `customer`
  Cannot access the customer map listing endpoint.

Map architecture boundaries (migrated to Google Maps, 2026-08 — see IMPROVEMENT_LOG.md):
- the map renders through the Google Maps JS SDK via `@vis.gl/react-google-maps` (`GoogleMapsApiProvider` wrapper), with marker clustering via `@googlemaps/markerclusterer`, inside Next.js client components. The previous OpenFreeMap / `react-map-gl/maplibre` / `maplibre-gl` stack has been removed.
- place search and address autocomplete use **Google Places**, called client-side with a browser API key (`GoogleMapsBrowserApiKey` secret). The old Next.js `/geocoding/search` · `/geocoding/reverse` route handlers and the Nominatim proxy (`geocodingService.ts`) have been deleted.
- the shared frontend feature lives under `packages/frontend/features/customerLocations` (map, picker, and `routePlanning/` route optimizer).
- backend customer map data remains in `ProtectedApi` as `GET /sales/customers/map`.
- customer address coordinates and geocoding metadata are stored on `CustomerAddress`.
- `GeocodingCache` is still the server-side coordinate cache, but it is now populated by the `prod`-only `GoogleMapsLocationRefresh` cron (`infra/googleMaps.ts` → `packages/core/src/core/helpers/crm/googlePlacesCoordinateRefresh.ts`), not by a request-time proxy.
- Google Maps / Places keys and Map ID are SST secrets wired in `infra/googleMaps.ts` (browser key for the client SDK, server key for the cron).

Current V1 location rules:
- one map pin is exposed per customer
- canonical address selection priority is:
  `isPrimary && isShipping` -> `isPrimary` -> first coordinate-bearing address by `displayOrder`
- portal users may geocode and pin their own addresses, but they do not receive a customer-list map screen
- the admin/sales map has a first-party multi-stop **route planner** (`features/customerLocations/routePlanning`, endpoint picker + optimization); turn-by-turn navigation itself is still handed off to external Google Maps URLs
- `Category.allowedAttributeValueIds` remains only for real category-scoped product filters such as `model_type`, `connection_type`, `profile_type`, `material_type`, `usage_type`, and `hat_type`
- public and customer product filters should present category-scoped product filters separately from industrial usage filters
- `/musteri/tanimli-urunler` profile matching uses customer assignments against `ProductIndustrialUsage`; `usageFunction` is display and SEO content only, not a matching criterion

Customer portal contact data is split into three intentionally different groups:
- customer-side contact people and portal accounts remain `User` records connected through `User.customerId`
- the primary Ceyhunlar sales representative remains `Customer.assignedSalesUser`
- additional Ceyhunlar department contact points live in `CompanyContact` and are exposed per customer through `CustomerCompanyContactAssignment`

`CompanyContact` records are display/contact records only. They do not create login accounts, panel roles, or authorization state. Admin/owner users manage the contact master data; sales users can manage assignments only for customers they are allowed to access. Customer portal reads should include only active contacts with active assignments, ordered by assignment display order, company contact display order, and creation time. Admin and sales detail surfaces may show inactive records for maintenance, but the portal must keep them hidden.

Customer phone numbers follow the same "primary + additional" split:
- `Customer.phone` stays the **primary** number; search, the map, business-request snapshots, the public lead form and the product→customer table read it
- additional lines (accounting, purchasing, mobile…) live in `CustomerPhone` (`Customer.additionalPhones`) with an optional `label` and a `displayOrder`
- writes are full replacements (`deleteMany` + `createMany`) and always go through `core/helpers/crm/customerPhones.ts`, which trims, drops empty rows, caps the list at 10 and de-duplicates by phone line (E.164 key via `normalizePhoneNumberToE164`), including against the primary number; uniqueness is an application rule, not a DB constraint, because the same line can be typed in different formats
- admin/sales `PUT /customers/{id}` · `PUT /sales/customers/{id}` and the content-entry `POST/PUT /lead-customers` accept `additionalPhones`; omitting the field leaves existing rows untouched
- customer list, map and lead-list searches also match additional numbers
- frontend: the shared `features/customerPhones` feature owns the UI — `CustomerPhonesField` (primary + labelled additional rows, used by both the admin/sales editor and the content-entry lead dialog) and `CustomerPhoneList` (click-to-call `tel:` list used by the CRM tables, cards and overview pages). Display order comes from `listCustomerPhones`, and the form's duplicate check uses the server's `customerPhoneKey`, so client and server agree on what counts as the same line. The customer portal, the public form, the map popup, the product→customer table and campaign announcements intentionally still show only the primary number

Customer records also support professional multi-address data through `CustomerAddress`.
Address records are ordered and can be marked as primary, billing, and shipping so the portal and CRM can present operational contact points without flattening them into a single text field.
Address normalization is intentionally progressive:
- human-readable fields such as `country`, `city`, `district`, `postalCode`, `line1`, and `line2` remain on the domain record for readability and backward compatibility
- normalized foreign keys such as `countryId`, `stateId`, and `cityId` point to internal reference tables
- reference lookup tables are stored in PostgreSQL through `GeoCountry`, `GeoState`, and `GeoCity`
- reference data is imported from the external `dr5hn/countries-states-cities-database` dataset through the project-owned `packages/core/prisma/seed-geo.ts` script

Geo lookup delivery rules:
- geo selectors are exposed through `PublicApi` endpoints so public forms, admin CRM forms, and future supplier flows can reuse the same lookup surface
- the application should not depend on an external runtime REST API for country/state/city selection
- temporary clone directories such as `/private/tmp/cscdb` are bootstrap aids only and are not part of the deployed system or persistent project assets

Current geo import inputs:
- `packages/core/prisma/geo-source/countries.csv`
- `packages/core/prisma/geo-source/states.csv`
- `packages/core/prisma/geo-source/json-cities.json`

Current operational limitation:
- the imported global dataset is suitable for country, state/province, and city selection
- mahalle/neighborhood precision should remain editable text until a country-specific source is intentionally introduced

Customer-facing operational requests are now modeled separately from profile/catalog data.
Portal-originated order, document, pricing, and profile-change intents should go through the generic `BusinessRequest` workflow engine instead of mutating domain records directly from the portal UI.

Customer portal request creation is intentionally type-specific at the UI layer:
- `Taleplerim` is the historical list surface
- create routes under `/musteri/talepler/*` can diverge visually by request type while preserving the same backend request contract
- item-based request types such as order and pricing should not be forced into the same layout when their review experience differs

Customer portal cart visibility is treated as part of portal chrome, not as an ad hoc overlay:
- desktop customer layouts can surface the cart summary in the topbar action area
- mobile customer layouts can use a safe-area-aware sticky bottom bar
- the cart preview data in the portal draft store may include client-only preview fields such as product image URLs, but these should not be forwarded into backend request payloads

The `/musteri/tanimli-urunler` experience lists **only** hierarchy-based matched
products from the customer profile assignment layer (`getCustomerFeaturedAndMatchedProducts`
→ `buildCustomerProfileProductWhereClauses`). Manual curation was removed:
- no `PUT /(sales/)customers/{id}/featured-products` endpoints, no admin/sales "İlgili
  Ürünler" workspace tab
- `GET /portal/customer/featured-products` stays; it now returns matched products only
- `assignedProducts` and `/musteri/musteriye-tanimli-urunler` remain strictly manual and operational

### Sales and purchasing role topology
The application now treats `sales_director` as a first-class business role between `sales` and `admin`.

Current hierarchy expectations:
- `owner`
  Cross-domain final authority and bypass capability.
- `admin`
  Cross-domain operational authority and final approval capability.
- `sales_director`
  Sales-domain supervisory role. Can review sales requests and override `sales` approval steps without becoming an admin.
- `sales`
  Customer-facing CRM operator scoped to assigned customers.
- `purchasing`
  Supplier-facing operator scoped to assigned suppliers.
- `customer`, `supplier`
  External portal users that submit requests but do not self-approve them.
- `content_editor`
  Internal data-entry role. Uses the `/veri-girisi` workspace and can manage category, product, and product attribute taxonomy content without receiving broad admin panel access.
- `production_planner`
  Internal production planning role. Uses the `/uretim` workspace (machines, molds, shift calendars, production orders, planning board — delivered in slices, see `docs/production-planning.md`). Not a party to sales/purchasing business requests and has no `/admin` access.

### Workflow orchestration
Supplier, customer, sales, and purchasing approvals should use the generic `BusinessRequest` workflow backbone.

### Generic business request workflow
`infra/businessWorkflow.ts` now defines the generic sales/purchasing approval backbone.

This workflow is the canonical approval engine:
- `BusinessRequest`
  Source-of-truth request record for customer/supplier/commercial intents.
- `BusinessRequestApprovalStep`
  Ordered human approval steps with role and optional assigned user.
- `BusinessRequestItem`
  Optional line items for variant-based portal requests such as quote/order style carts.
- `ActivityLog`
  Event-driven activity timeline persisted from workflow events (asynchronous, request-scoped).
  Not the data-change audit trail — that is `AuditLog`, see "Audit log" under Core and Data Layer.

Current design split:
- PostgreSQL is the business source of truth.
- API Lambda handlers perform synchronous business decisions and persist DB state first.
- Step Functions manages the long-running approval state and next-step progression.
- EventBridge distributes domain events such as:
  `business-request.created`
  `business-request.pending-approval`
  `business-request.step-approved`
  `business-request.rejected`
  `business-request.completed`

Supplier-specific usage rules:
- Supplier profile, pricing, category create, product create, and variant create intents should all be represented as `BusinessRequest` rows in the `PURCHASING` domain.
- Supplier review chains can have multiple assigned purchasing users. Any assigned purchasing user may approve the purchasing step.
- Review UIs should keep the diff-first presentation style by comparing `currentSnapshot` and `requestedData`.
- EventBridge subscribers persist activity logs, user notifications, workflow emails, and realtime notification messages.
- Browser realtime topics must be namespaced by app and stage because AWS IoT is shared across apps/stages in an account. The user notification topic shape is `${appName}/${stage}/notifications/users/${dbUserId}`.
- The production change topic is `${appName}/${stage}/production/changes` (slice 4.4): subscribe rights are role-based (ACTIVE users in the production planner groups, re-checked by the authorizer every 5 minutes; rules in `UserAccessLifecycle/functions/realtimeAccess.ts`), and the authorizer ends every connection when its Cognito id token expires.
- Browser subscriptions share `packages/frontend/features/realtime` (`useRealtimeTopic` over the React-free `startRealtimeSubscription`): a fresh token from `getSession()` on every connection, renewal before expiry, retry on authorization / SUBACK rejection. Lambda publishers wrap the SST endpoint with `iotDataEndpointUrl` — SST exposes a bare host name and AWS SDK v3 rejects it with `Invalid URL`.

Customer-specific request UX rules:
- `CUSTOMER_ORDER_REQUEST` may use a checkout-style stacked draft preview above its form because line-item verification is the primary task
- `CUSTOMER_ORDER_REQUEST` carts may contain line items with different payment terms, KDV status, currencies, and price sources; the portal should inform the customer and show line-level conditions instead of blocking request creation
- when an approved customer order request contains multiple currencies, the resulting `Order` keeps item-level currencies and uses `currency = "MIXED"` with null aggregate money totals; currency-specific subtotals belong in the request/order snapshot rather than being summed into a misleading single total
- `CUSTOMER_PRICING_REQUEST` can continue using an item-based comparison layout, but it should remain separate from order request layout decisions
- profile and document request forms should remain simpler non-cart flows even though they share the same `BusinessRequest` backbone

Customer-specific special price rules:
- Customer-specific special prices live in `CustomerVariantSpecialPrice`, not in `ProductVariantSupplier`.
- They may carry minimum/maximum order quantity, payment term, validity period, KDV status, delivery terms, contract reference, customer-visible notes, and internal notes.
- Simple payment terms continue to use `paymentTermDays` and `paymentTermLabel`; multi-step terms use structured `paymentSchedule` JSON with percentage, due-day, label, and optional note per step.
- A special price applies only to its `customerId + productVariantId` pair when active, current, and quantity-eligible; when it applies, `Customer.generalDiscountPercent` is not applied.
- Special prices never update `ProductVariantSupplier.listPrice` or supplier cost/profit calculations.
- Portal request/order creation snapshots the resolved `priceSource`, unit price, currency, quantity constraints, simple/multi-step payment terms, validity, tax status, and contract reference into item data so historical records remain stable after future price edits.
- Customer portal users must request new customer-specific special prices through `BusinessRequest` records, not by directly creating `CustomerVariantSpecialPrice`.
- Customer-originated special price requests use `CUSTOMER_PRICING_REQUEST` with `requestedData.requestKind = "CUSTOMER_SPECIAL_PRICE_REQUEST"` and complete into an upserted `CustomerVariantSpecialPrice` only after the sales approval chain finishes.
- If a customer accepts a sales counter offer during that workflow, final approval must store the accepted counter price instead of the customer's original requested price.
- Customer-originated special price request payloads must not create or preserve internal notes on the resulting special price record.
- Customer-originated requests always enter the workflow with `NORMAL` priority; customer portal UI must not expose priority controls, and the backend must ignore customer-supplied priority payloads.

This split is intentional:
- EventBridge answers “what happened?”
- Step Functions answers “who needs to act next?”
- PostgreSQL answers “what is the current business truth?”

### Supplier request model
Supplier-originated operational changes should converge on the generic workflow system.

Current target model:
- Supplier users can view the global product catalog but only see their own supplier-price records when they exist.
- Supplier users submit change requests instead of mutating protected records directly.
- Typical supplier requests include:
  profile updates,
  supplier pricing updates,
  capability changes,
  and later product or variant creation proposals.
- These requests should be represented as `BusinessRequest` rows under the `PURCHASING` domain.
- Review surfaces should emphasize `currentSnapshot` vs `requestedData` differences, preserving the existing diff-first review style from the old supplier approval UI.

Purchasing assignment:
- multi-purchasing assignment is implemented: `Supplier.assignedPurchasingSuppliers` ↔ `User.assignedPurchasingSuppliers` is a many-to-many relation (`@relation("SupplierPurchasingAssignments")`). There is no single `assignedPurchasingUserId` scalar on `Supplier`.
- any assigned purchasing user may approve the purchasing step of that supplier's workflow interchangeably.

The generic workflow currently supports the following approval defaults:
- Sales domain:
  `customer -> sales -> sales_director -> admin`
  with `admin/owner` bypass and `sales_director` override over `sales` steps.
- Purchasing domain:
  `supplier -> purchasing -> admin`
  with `admin/owner` bypass.

Do not add direct portal mutations for customer/supplier operational requests if they should be reviewable. They should become `BusinessRequest` records and enter the workflow bus/state-machine path.

## Frontend Architecture

### App Router structure
The frontend uses route groups and persona-specific sections. The tree has two roots:
locale-aware public/auth pages under `app/[locale]/`, and the internal panels under
`app/(panels)/` (outside `[locale]` — see Internationalization below).

Important route segments currently include:
- `app/[locale]/(public)`
  Public SEO-facing pages (locale-prefixed for non-`tr`)
- `app/[locale]/(auth)/auth`
  Custom authentication routes rendered without the public marketing shell
- `app/(panels)/admin`
  Admin panel (`potansiyel-musteriler` = `Customer.status = LEAD` list, `cari-musteriler` = `CUSTOMER` list)
- `app/(panels)/musteri`
  Customer portal
- `app/(panels)/satinalma`
  Purchasing-facing routes
- `app/(panels)/satis`
  Sales-facing routes
- `app/(panels)/veri-girisi`
  Internal content/data-entry workspace for `content_editor`
- `app/(panels)/uretim`
  Production planning workspace for `production_planner` (admin/owner may also enter)
- `app/(panels)/tedarikci`
  Supplier-facing workspace (`app/(panels)/supplier` is a redirect/alias)
- `app/(panels)/hesabim`
  Authenticated account-status screen for pending/suspended/rejected users
- `app/api/auth`
  NextAuth route handlers

Keep SEO-critical public pages server-rendered whenever possible.
Use client components as leaf nodes rather than converting entire public routes to client rendering.

### Internationalization (i18n)
The frontend is fully localized with **`next-intl`**. Key decisions (full history in IMPROVEMENT_LOG.md § i18n):
- **14 published locales** (`packages/frontend/i18n/routing.ts`): `tr`, `en`, then `de fr es it pt pl` (wave 1), `ru` (2), `ar` (3, RTL), `ko ja zh hi` (4). System-recognized locales live in `packages/core/src/core/i18n/locales.ts` (`SUPPORTED_LOCALES`).
- **`localePrefix: "as-needed"`** — Turkish URLs stay unprefixed (`/hakkimizda`); other locales live under a prefix (`/en/hakkimizda`). **`localeDetection: false`** — locale changes only by explicit user choice, never by `Accept-Language`.
- **Panels are outside `[locale]`** (`app/(panels)/`) because `proxy.ts`'s `withAuth` matcher must keep protecting them; they render with a `tr`-fixed `NextIntlClientProvider` so shared components still resolve.
- **Message catalogs**: `packages/frontend/messages/<locale>.json`, one namespace per feature/page. `tr.json` is the source of truth; `en.json` (and the rest) must have equal key counts. Zod schemas that need translated messages use the `buildXSchema(t)` factory pattern.
- **DB content** is translated per-model through additive `XTranslation` tables (`CategoryTranslation`, `ColorTranslation`, `MaterialTranslation`, `MeasurementTypeTranslation`, …) with a TR backfill + DeepL-assisted draft/apply CLI. Legacy `name`/`slug` columns are kept until a model's readers/writers have all moved over. Missing translations fall back to the TR source and mark the page `noindex` + out of the sitemap.
- SEO: locale-aware `generateMetadata` with `alternates.languages` (hreflang) and a locale-aware `app/sitemap.ts`.
- Backend notification/email text is **not** localized yet (still persisted as TR at production time) — that is a planned phase, see IMPROVEMENT_PLAN.md § i18n.

### Feature structure
Feature code lives under `packages/frontend/features`.

Common internal slices include:
- `api/`
- `components/`
- `hooks/`
- `server/`
- `schema/`

Page files should mostly compose these feature modules.
Avoid burying fetch logic, local state orchestration, tables, forms, and mutations directly inside `app/**/page.tsx`.

### Provider chain
`packages/frontend/app/providers.tsx` currently wraps the app with:
- `SessionProvider`
- `NuqsAdapter`
- `QueryClientProvider`
- `Toaster`
- `ReactQueryDevtools`

This means the default client-side platform assumptions are:
- auth session is available via NextAuth
- URL query state should use `nuqs`
- async server state should use TanStack Query
- user-facing notifications should use Sonner

### HTTP client architecture
`packages/frontend/lib/http/client.ts` defines dedicated Axios clients for:
- public API
- admin API
- protected API

The admin and protected clients attach `Authorization: Bearer <idToken>` by reading the current NextAuth session.

Do not scatter raw API base URLs or custom fetch wrappers across features when the existing HTTP client layer already covers the use case.

### Session and token flow
`packages/frontend/lib/auth/auth.ts` is the current NextAuth integration.

Key behavior:
- Credentials-based provider backed by server-side Cognito API calls
- refresh token flow against Cognito token APIs
- logout revokes refresh token before ending the NextAuth session
- session is enriched with database-backed access state on sign-in, refresh, and session materialization
- session exposes `idToken`, `accessToken`, `groups`, `dbUserId`, `accessStatus`, and linked portal entity ids when available

If auth behavior changes, update both:
- frontend session/token flow
- backend Cognito claim parsing assumptions

## Backend Architecture

### Lambda entrypoint pattern
Each Lambda boundary follows a consistent pattern:
- `actions.ts`
  creates dependencies and exports lambda-wrapped handlers
- `handlers/`
  contains request handler factories or implementations
- `validators/`
  contains request/response validators
- `types/`
  contains event and dependency contracts

Example flow:
- infra route points to a Lambda action
- action builds dependencies
- `lambdaHandler` wraps the handler
- request is validated and authenticated
- handler delegates to repositories/helpers
- response is normalized through shared response helpers

### Shared Middy pipeline
`packages/core/src/core/middy.ts` is the standard Lambda wrapper.

Current shared pipeline includes:
- warmup handling
- event/header normalization
- content negotiation
- path/body parsing
- request validation
- auth middleware
- security headers and CORS
- response serialization
- optional response validation
- structured logging: AWS Lambda Powertools logger (`packages/core/src/core/logger.ts`) with a per-request `correlationId` (from `requestContext.requestId`), `POWERTOOLS_SERVICE_NAME` set per boundary; `userSub` / `userGroups` are appended after auth. `logEvent` is off; PII claims (email) are not logged.
- error handling

New HTTP Lambdas should use `lambdaHandler` unless there is a strong reason not to.

### Auth middleware
`packages/core/src/core/middleware/authMiddleware.ts` performs:
- Cognito claim extraction
- group normalization and parsing
- automatic user creation on first authenticated request
- access-state-aware normalization using the application database as source of truth
- conservative claim backfill for existing users: profile identity fields should only be backfilled when the DB record is still missing them, so in-app profile updates are not overwritten by stale JWT claims
- `isActive` guard
- derived role flags on `event.user`
- permission checking with role hierarchy for core roles

This middleware is a central architectural decision.
It means the application database becomes the normalized user context source after Cognito authentication is accepted.

### User access lifecycle
Current access lifecycle model:
- Cognito confirmation creates a DB `User` with `groups = ["user"]`
- new users start with `accessStatus = PENDING_REVIEW`
- `user` is a no-panel default group
- admin can assign business roles: `user`, `supplier`, `purchasing`, `sales`, `sales_director`, `customer`, `content_editor`, `production_planner`
- owner can additionally assign `admin` and `owner`
- pending or otherwise inactive users can sign in, but they are routed to `/hesabim`

Current persistence fields on `User`:
- `accessStatus`
- `accessStatusChangedAt`
- `accessStatusChangedByUserId`
- `accessStatusReason`

User-facing notification persistence uses `UserNotification`:
- `ACCESS_STATUS_CHANGED`
- `ROLE_CHANGED`
- `ASSIGNMENT_CHANGED`
- `REQUEST_CREATED`
- `APPROVAL_REQUIRED`
- `REQUEST_DECIDED`
- `PRODUCTION_ALERT` (slice 4.5 — sub-kind in `data.kind`, dedupe key `data.alertKey`, panel link `data.href`)

Business request workflow notifications use the same target resolution for persistence and realtime delivery. `business-request.pending-approval` targets the active approval owner/group, and customer order requests also fan out observer notifications to active admin/owner users for immediate admin visibility.

### User access events
Role or access changes are modeled as a synchronous update plus asynchronous fan-out:
1. Admin or owner updates the user role/access state.
2. A shared core helper updates Cognito groups and the PostgreSQL `User` record together.
3. The API publishes `user.access.updated` to the `UserAccessBus`.
4. Subscribers persist an in-app notification, send an email, and publish a realtime message.

Current rationale:
- Step Functions is not used here because this flow is not a long-running workflow.
- `Bus + Realtime + SES` is the current event-driven pattern for access lifecycle notifications.

### Current role model
Derived booleans currently include:
- `isOwner`
- `isAdmin`
- `isSupplier`
- `isPurchasing`
- `isSales`
- `isSalesDirector`
- `isCustomer`
- `isContentEditor`
- `isProductionPlanner`

Keep these flags consistent across frontend assumptions, middleware output, and API permission checks.

## Core and Data Layer

### Prisma access
`packages/core/src/core/db/prisma.ts` creates the Prisma client using SST resource linkage to the stage database.

Current notable behavior:
- In prod, Prisma builds the connection string from the linked RDS fields.
- In non-prod, Prisma uses the linked Neon pooled URL.
- global reuse is enabled in non-production environments
- Prisma query extensions implement soft-delete behavior for some models such as `color` and `supplier`

This means repository code may observe soft-delete filtering automatically for those models.

### Repository pattern
Repositories in `packages/core` encapsulate database access and shape the persistence boundary.

Use repositories for:
- repeated query patterns
- transaction-safe mutation flows
- database-specific concerns
- centralizing model-specific reads and writes

Do not duplicate complex Prisma query trees across multiple Lambda handlers if they can be owned by a repository.

### Audit log
`AuditLog` is the data-change audit trail: who changed which record, when, from which endpoint, and each changed
field's value before and after. It is rolled out model by model; today it covers `Category` (fields + translations)
and `Customer` — leads and accounts alike, with their addresses, extra phones, profile assignments, company contacts
and commercial terms.

How it differs from `ActivityLog`:

| | `AuditLog` | `ActivityLog` |
|---|---|---|
| Records | field-level changes of a row | business-request workflow events |
| Written | in the SAME DB transaction as the change | asynchronously by an EventBridge subscriber |
| Keyed by | `entityType` + `entityId` (no FK — survives deletion) | `requestId` (FK to `BusinessRequest`) |
| Guarantee | no change without a record, no record without a change | best effort |

Write path (`packages/core/src/core/helpers/audit/`):
- The handler builds an `AuditContext` from the request with `buildAuditContextFromEvent`: the actor is the
  DB `User` that `authMiddleware` resolved from the verified Cognito token, plus the route key, the API Gateway
  request id (the same value as the `correlationId` in CloudWatch), source IP and user agent.
- The repository's write method (the context is a required parameter) opens a transaction, locks the row, reads the
  previous state, applies the change and calls `writeAuditLog(tx, …)` with the field-level diff
  (`diffAuditSnapshots` over the model's allowlisted snapshot, e.g. `toCategoryAuditSnapshot`).
- The actor's identity at the time of the event (name, e-mail, groups, Cognito sub) is copied into the row, so the
  record stays readable after the user is renamed, regrouped or deleted (`actorUserId` then becomes NULL).
- Actor types: `USER` (verified token), `SYSTEM` (event-driven Lambda, cron, operator CLI) and `ANONYMOUS` (the public
  web form — `buildAnonymousAuditContext`; IP and user agent stay in the row). Accepting a portal invitation is
  recorded under the new portal user (`buildUserAuditContext`) with the invitation id in `metadata`.
- Deletes store the last state plus what the cascade removed (`metadata.cascade`).
- `Customer` is an aggregate spread over five tables. Every write to them goes through
  `core/helpers/prisma/customers/repository.ts`, which wraps the change in a "surrounding snapshot": lock the customer
  row, read the audited state (`customerAuditInclude`), apply the change, read it again and diff — so any child-table
  change lands in the customer's history without per-endpoint diff code. The snapshot (`toCustomerAuditSnapshot`,
  `core/helpers/crm/customerAudit.ts`) stores references by name and keys addresses by their label (business-request
  approval rewrites address rows, so ids churn); the Google Places coordinate cache is left out because the daily
  refresh cron would flood the history. Bulk writes (lead bulk delete, sales-rep reassignment from the user editor)
  write one row per affected customer with a single `createMany`.

Read path: `GET /audit-logs?entityType=&entityId=` on the Admin API (admin / owner only) returns a record's history,
newest first, with a `summary` of who created it and who changed it last. Audited models carry no
`createdBy` / `updatedBy` columns — that information is derived from the log. The UI is the generic
`features/admin/auditLogs` timeline with a per-model presenter: the category dialog's history tab and the admin
customer workspace's "Değişiklik Geçmişi" page (`/admin/customers/[id]/history`).

Known gaps (tracked in `IMPROVEMENT_PLAN.md`): category images (`Asset`), operator CLI scripts and the customer's
satellite records (visits, special prices, assigned products) do not write audit records yet; a deleted record's
history is not reachable from the UI; rows created before the rollout have no history.

### CRM and portal model
The customer side is no longer only a passive lead table.

Current CRM structure includes:
- `Customer.status` with `LEAD` and `CUSTOMER`
- `Customer.assignedSalesUserId`
- `Customer.convertedAt` and `Customer.convertedByUserId`
- `Supplier.assignedPurchasingSuppliers` ↔ `User.assignedPurchasingSuppliers` (many-to-many purchasing assignment)
- `User.customerId` for customer portal users
- `CustomerVisit` for planned/completed/canceled visit tracking

Operational meaning:
- `sales` users should work from assigned customers
- `purchasing` users should work from assigned suppliers
- `customer` users should only see their own portal data under `/musteri`
- `admin` and `owner` can see and assign across those operational boundaries

Important distinction:
- `User.customerId` and `User.supplierId` are portal-account bindings for external customer/supplier users
- operational ownership for internal staff is modeled on the business entities:
  - `Customer.assignedSalesUserId`
  - `Supplier.assignedPurchasingSuppliers` (many-to-many)
- do not confuse those two concepts in UI or API design

### Production planning model (in progress)
Design and roadmap: `docs/production-planning.md`. Master data is in place (schema section
"ÜRETİM PLANLAMA — TANIMLAR", migration `20260925120000_add_production_master_data`):
- `ProductionArea` → `ProductionMachine` (clamp force, tie-bar spacing, mold height range, …)
- `Mold` → `MoldOutput` → `ProductSize`: a mold is bound to a product-model SIZE, not a variant,
  so it presses every colour/material version of that size; a family mold may hold sizes of
  different product models. `MoldOutput → ProductSize` is `Restrict` — any flow that deletes
  sizes must skip or block sizes held by a mold
- `MoldMachineProfile` (proven cycle/setup, preferred, blocked), `MaterialProcessProfile`
  (1:1 production data beside the catalog `Material`)
- `ShiftPattern`/`ShiftDefinition` (daily working hours 12/16/24), `ProductionCalendarException`,
  `MachineDowntime`, `ProductionOperator` (staff record, NOT a login account)

Implemented surfaces (slices 1.3–1.5): ProtectedApi `/production/areas`, `/production/shift-patterns`,
`/production/machines`, `/production/molds` (outputs + machine profiles written with the mold, full replace),
`/production/material-profiles`, `/production/references/products[/{id}/sizes]`, `/production/operators`,
`/production/calendar-exceptions` (+ `/bulk-delete`), `/production/machine-downtimes` (planner/admin/owner —
one list in `packages/functions/src/shared/production/access.ts`; per-entity `actions.ts` under
`packages/functions/src/ProtectedApi/functions/production*`) and the `/uretim/alanlar`,
`/uretim/vardiyalar` (shift patterns + calendar exceptions), `/uretim/makineler` (machines + downtimes),
`/uretim/kaliplar`, `/uretim/uyumluluk` (mold × machine matrix, computed client-side — no endpoint),
`/uretim/operatorler`, `/uretim/hammaddeler` screens (`packages/frontend/features/production/**`).
Pure rules shared by handlers and forms live in `packages/core/src/core/helpers/production/`:
`shiftPatterns.ts` (workday = day of the first shift, night shift belongs to it, no overlap,
≤ 24 h; effective pattern machine → area → default), `productionCalendar.ts` (one exception row
per DAY; ranges are expanded on write and regrouped for display; one exception per day and
scope, the narrowest scope wins: machine > area > factory), `machineDowntimes.ts` (half-open
intervals, no overlap per machine) `productionTime.ts` (timestamps stored in UTC, entered and
shown in factory time `Europe/Istanbul` — never browser-local, never a hard-coded offset) and
`moldMachineCompatibility.ts` (mold ↔ machine checks with ok / warning / unknown / error per check,
recommended machine = preferred card, else the smallest adequate press; the phase-2 engine filters
candidates with the same function). Hydraulic clamps carry `ProductionMachine.maxDaylightMm`: usable
opening = min(stroke, daylight − mold thickness).

Phase 2 (in progress): `ProductionOrder` (slice 2.1) — auto-increment order number shown as
"UE-1001", `productVariantId` with `onDelete: SetNull` plus a `variantCode` snapshot (same pattern
as `OrderItem`: deleting a catalog variant never fails on production history; an order without a
variant is not planned), opened only for sizes with a usable (non-retired) mold. ProtectedApi
`/production/orders` (server-paginated), `/production/references/products/{id}/variants`,
`/production/references/customers` (id + name only); screen `/uretim/emirler`.
Order rules (manual status DRAFT ⇄ ON_HOLD ⇄ CANCELLED, only DRAFT deletable, customer required for
customer orders) live in `core/helpers/production/productionOrders.ts`. Slice 2.2 adds the pure
planning engine — `shiftCalendar.ts` (shift pattern + calendar exceptions + downtimes → working
windows in factory time), `jobScheduling.ts` (cycle-time chain, shots, duration, forward
scheduling, shift lots) and `orderCandidates.ts` (per mold × compatible machine plan preview) —
served read-only by `GET /production/orders/{id}/candidates`. Slice 2.3 adds `ProductionJob`
(auto-increment `lotBaseNumber` from 1000), `ProductionJobOutput` (every mold output; the order's
size links to the order, others are by-products), `ProductionLot` / `ProductionLotOutput` (one lot
per shift; lot number `base-sequence` is derived, not stored). `POST /production/orders/{id}/jobs`
recomputes the chosen candidate server-side (never trusts client times) and writes job + outputs +
lots + order status in ONE array transaction with pre-generated ids (`core/helpers/production/jobPlan.ts`);
existing active jobs block machine and mold time. Mold output edits are diff-based (rows kept by
size) because job outputs reference `MoldOutput` with `Restrict`; machines/molds with jobs cannot
be deleted (409).

Phase 3 (in progress): slice 3.1 adds the read-only planning board `/uretim/tahta`, fed by
`GET /production/board?from&to` (narrow DTO: non-inactive machines with their shift instances and
per-day calendar exceptions, downtimes, non-cancelled jobs with lots). Window rules and per-machine
shift instances come from `core/helpers/production/productionBoard.ts` (same effective-pattern
resolution as the engine; downtimes are NOT subtracted there — the board draws them as blocks);
the drawing geometry is a pure, tested frontend helper (`features/production/board/utils/boardGeometry.ts`).
Planning writes and job cancellation invalidate the board query prefix. Slice 3.2 makes the board
editable: planned jobs are dragged (`@dnd-kit/core`, time = horizontal with 15-minute snap, machine =
row) or moved with the "Taşı" form in the job dialog; the board DTO carries each job's `version` and
`machineFit` (mold × visible machine verdicts) for live row feedback, while
`PATCH /production/jobs/{id}/schedule` re-plans server-side with the same engine and optimistic
locking on `ProductionJob.version`. Slice 3.3 adds the pending (DRAFT) orders panel — cards carry a
server-computed best-mold `machineFit` and are dropped onto a machine row (`POST
/production/orders/{id}/jobs` with optional `moldId`, `startAt`, `placement`) — and the
"push-later" placement mode: the placed job sits at the requested time and later PLANNED jobs on
that machine are re-planned behind it in order (`core/helpers/production/jobRipple.ts`). All
placement flows share `productionOrders/handlers/placement.ts` and commit through
`productionJobRepository.commitPlacement` in a single array transaction. Slice 3.4 adds the job
status board `/uretim/pano` (`GET /production/kanban`, `PATCH /production/jobs/{id}/status`): the
pure `core/helpers/production/jobStateMachine.ts` owns the transitions (PLANNED ⇄ RELEASED → SETUP →
RUNNING ⇄ PAUSED → COMPLETED), the completion quantity rules and the order status derived from its
jobs; a released job is locked on the planning board. Slice 3.5 (migration
`20260926150000_add_production_shift_assignments_and_lot_notes`) adds the crew roster
(`MachineShiftAssignment`, screen `/uretim/ekip`), lot operators (`ProductionLotOperator`) and lot
notes (`ProductionLotNote`, optionally attributed to an operator since operators have no login),
the lot list / detail screens (`/uretim/lotlar`, `/uretim/lotlar/{lotNumber}` with a printable QR
label via `qrcode.react`; printing uses a `.print-root` portal + a scoped `@media print` rule in
`globals.css`). Rescheduling now updates lots in place by sequence so notes and crews survive a
move; job completion freezes the roster crew into each lot. Slice 4.2 (migration
`20260928100000_add_production_shift_reports`) adds shop-floor data entered by the planner as a
per-lot shift report (`/uretim/saha`, lot detail): actual start / end, good / scrap per output with a
scrap-reason breakdown (`ProductionLotScrap`), stops (`ProductionStop`), shots; one reason dictionary
(`ProductionReason`, STOP with a category / SCRAP); a report closes the lot, starts the next one and
moves the mold shot counter. `ProductionJobStatusChange` records every job status change (planning,
kanban, lot start) and backs the kanban "completed recently" column. Slice 4.4 makes the workspace
live: every production write action is wrapped with `withProductionChange(scope, …)`
(`functions/shared/production/realtime.ts`) and publishes a data-free hint (`plan` / `roster` /
`lots` / `reasons` / `definitions`, contract `core/helpers/production/productionRealtime.ts`) to
the production change topic after success; those routes use `productionMutationRouteOptions`
(endpoint via env + `iot:Publish` on that single topic ARN — the Realtime component is not linked,
since its link grants `iot:Publish` on `*`). The `/uretim` layout mounts `ProductionRealtimeProvider`
once; it coalesces hints for 400 ms and invalidates the matching query prefixes, and refetches
everything after a reconnect. Phase 5 (statistics) starts with slice 5.1, the product history
(`GET /production/stats/products`, screen `/uretim/istatistikler/urunler`): the repository fetches a
superset of jobs (planned interval overlaps the window or a lot started in it) and the pure
`core/helpers/production/productionStats.ts` builds rows per job output (final count for completed
jobs, sum of reported lots otherwise; actual cycle = reported run time ÷ shots; window check on the
job's production period); Excel is generated in the browser with a lazily imported `exceljs`. Slice
5.2 adds machine utilization and OEE (`GET /production/stats/machines?from&to&areaId`, screen
`/uretim/istatistikler/makineler`) with the rules in the pure `core/helpers/production/machineStats.ts`:
the TIME breakdown is clock-based and clipped to the window (shift capacity from the machine's shift
pattern minus calendar exceptions = in-shift production from reported lots + machine downtime records
that do not overlap production + idle; out-of-shift production is reported separately), while OEE
(availability × performance × quality) uses only reported lots that START in the window; machine
downtime records never enter OEE. The window ends at "now", so today's future shifts do not count as
idle. "Unreported" lots are the ones closed with the job without a report, excluding never-started
lots planned after an early completion (completion time from `ProductionJobStatusChange`). Slice
5.3 closes Phase 5 with mold statistics (`GET /production/stats/molds`, screen
`/uretim/istatistikler/kaliplar`, rules in the pure `core/helpers/production/moldStats.ts`): counter and
maintenance (projected with the open jobs' unprinted shots via `remainingJobShots`, the same number the
alert sweep uses), actual vs planned cycle per mold, per mold × machine (compared with the mold-machine
card) and per mold × colour / material. A suggestion appears with at least 3 reported shifts and a 5 %
gap; it is never written automatically — "Karta uygula" calls
`PATCH /production/molds/{id}/machine-profiles/{machineId}` (card upsert, step 2 of the cycle-time
chain), so only later plans change. Slice 4.5 adds persistent production alerts without an API route: a
scheduled sweep (`infra/productionAlerts.ts` → `functions/src/ProductionAlerts/`; prod every 15
minutes, other stages only with `PRODUCTION_ALERTS_ENABLED="true"` so Neon is not kept awake) runs
the SAME forecast (`forecastJobsOnMachines`, shared with the board) for on-floor jobs and planned
jobs whose production start has passed, plus mold maintenance for active molds, and writes
`PRODUCTION_ALERT` notifications for ACTIVE `production_planner` users (rules and dedupe keys in
`core/helpers/production/productionAlerts.ts`; delivered keys are read back from the notification
rows, no extra table) with one realtime toast per user. The production panel shows the notification
bell; a production alert opens the board with the job selected (`?is=`) or the molds page. Slice 4.3 compares plan and
actuals without schema changes: `core/helpers/production/jobForecast.ts` is the single forecast
(progress from reported shots; the remaining shots are placed on the machine's working windows with
the planned cycle and efficiency, starting from the running lot's actual start, else the last
report's end, else now + setup) and `moldMaintenance.ts` the single maintenance status (85 % warning
ratio, projected with the board's planned shots). The board DTO carries `forecast`,
`moldMaintenance` and lot actuals and also lists ON-FLOOR jobs whose planned end lies before the
window (`ON_FLOOR_JOB_STATUSES` — an overrunning job still holds the machine; stale PLANNED jobs are
not added because the engine does not treat them as busy). `POST /production/jobs/{id}/push-followers`
recomputes the forecast server-side and reuses the 3.3 ripple (`planRippleFollowers` +
`commitPlacement`) behind the projected end; `POST /production/molds/{id}/maintenance` resets the
maintenance counter and stores the maintenance DAY in the mold form's convention (factory date at UTC
midnight).

### Mapping and DTO helpers
The repo already has custom mapping conventions that are part of the architecture.

Examples:
- `mapProductWithAssets`
- `apiResponse`
- `apiResponseDTO`

These helpers are not generic utility noise. They are part of the application boundary and should be reused instead of bypassed ad hoc.

### Shared domain helpers
Cross-cutting business logic should live in core helpers.

Current examples:
- pricing calculation logic centralized in `packages/core/src/core/helpers/pricing`
- business request approval domain logic in `packages/core/src/core/helpers/businessRequests`

When a rule must stay consistent across admin UI, supplier workflows, and bulk operations, it belongs in `packages/core`, not in a single handler or component.

## Request Flow Reference

### Public page flow
Typical public content flow:
1. App Router server page loads.
2. Server-side data is fetched where SEO matters.
3. Public API or server helper returns domain data.
4. DTO/mapping helpers shape the response.
5. The page renders server-first HTML, with client islands only when needed.

### Admin or protected mutation flow
Typical authenticated operational flow:
1. User signs in via Cognito + NextAuth.
2. Frontend mutation uses `adminApiClient` or `protectedApiClient`.
3. Bearer token is attached from session `idToken`.
4. API Gateway authorizer provides JWT claims to the Lambda.
5. `authMiddleware` parses claims and synchronizes user state.
6. Handler validates input, performs repository/domain work, and returns a typed response.
7. For an audited model the handler also passes an `AuditContext` to the repository, which writes the `AuditLog`
   row in the same transaction as the change (see "Audit log").

### Customer portal flow
Current customer portal lifecycle:
1. A `Customer` record exists as `LEAD` or `CUSTOMER`.
2. Admin/owner can assign a sales representative. "İlgili Ürünler" is not assigned by
   hand — it is derived from the customer's profile (sector / production group / usage area).
3. A Cognito user in the `customer` group can be linked to that `Customer` through `User.customerId`.
4. The customer signs in through the same custom auth surface after access is activated by an internal user.
5. `/musteri` reads only the linked customer record plus its profile-matched products.

Portal scope is intentionally narrow in v1:
- overview
- defined products
- profile / firm information

### Sales and purchasing workspaces
The internal role workspaces are no longer topbar-only pages.

Current expectation:
- `/satis` uses a left navigation shell with at least assigned customers and products
- `/satinalma` uses a left navigation shell with at least assigned suppliers and products
- `/veri-girisi` uses a left navigation shell for internal content/data-entry tasks; v1 includes category management
- `/veri-girisi/products` reuses the admin product CRUD surface for content entry, without exposing broad `/admin` workspace navigation
- `/veri-girisi/productAttributes` reuses the admin product attribute CRUD surface for sectors, production groups, usage areas, and other product attribute values without exposing broad `/admin` workspace navigation
- product browsing may reuse the shared supplier/purchasing/sales variant price feature as long as visibility rules remain role-safe

Visibility rules currently expected:
- `sales` can browse products and customer-safe pricing outputs, but not supplier/cost-oriented purchasing data
- `purchasing` can browse products and supplier-side cost data, but not sales-facing profit or list-price emphasis
- `content_editor` can manage category, product, and product attribute taxonomy content through the data-entry workspace, but should not gain broad `/admin` access

### Supplier request flow
Current supplier request lifecycle:
1. Supplier submits a profile, pricing, category, product, or variant request.
2. Protected API creates a `BusinessRequest` in the `PURCHASING` domain.
3. The API starts the generic `businessApprovalWorkflow` Step Functions execution.
4. The workflow publishes the relevant business-request events and advances approval steps.
5. Purchasing inbox users see the pending item in the generic approval UI.
6. Any assigned purchasing user can approve the purchasing step.
7. Admin or owner completes the remaining approval step when required.
8. Final approval applies the requested change to the domain entity and stores `completedSnapshot`.

This split is intentional:
- request persistence and final DB status change happen in API/application logic
- workflow orchestration handles human waiting, retries, and event publication

### Approval review UI pattern
The admin and purchasing approval UI should optimize for review speed.

Current expectation:
- show changed fields first
- allow optionally revealing unchanged fields for context
- use explicit before/after visual contrast instead of two raw value dumps
- keep approval/rejection actions close to the diff content
- variant pricing requests may surface a compact product summary with a direct link to the related admin variant page

## Extension Guide

### Adding a new frontend feature
Preferred steps:
1. Add or extend a feature module under `packages/frontend/features/<domain>`.
2. Keep route `page.tsx` thin and compose the feature from there.
3. Use Server Components by default.
4. If client state is needed, prefer extracted hooks and smaller client leaves.
5. Use TanStack Query for async server state.
6. Use `nuqs` for URL-persisted filter/pagination state.

### Adding a new API endpoint
Preferred steps:
1. Choose the correct boundary: public, protected, admin, or owner.
2. Add or extend a Lambda under `packages/functions/src/<Boundary>/functions/...`.
3. Follow the existing `actions.ts` / `handlers` / `validators` / `types` structure.
4. Reuse `lambdaHandler`.
5. Add the route in the corresponding infra API file.
6. Move repeated domain logic into `packages/core`.

### Adding new shared domain logic
Put it in `packages/core` when:
- more than one handler needs it
- a business rule must stay consistent across workflows and APIs
- persistence logic or transformations should be centralized

### Adding new workflow automation
Use infra-level wiring for:
- Step Functions resources
- EventBridge buses
- links and permissions

Keep workflow Lambdas thin and move reusable business rules into `packages/core`.

## Current Implementation Notes
- The workspace targets Node `>=24 <25` (`.nvmrc` `24.19.0`; CI reads it via `node-version-file`). Every infra Lambda `runtime` pin is `nodejs24.x` **except** the Cognito `postConfirmation` trigger, still `nodejs20.x`. Frontend Lambdas already run `nodejs24.x` in prod; the API-Lambda `nodejs22.x → nodejs24.x` change is committed but not yet deployed to prod (IMPROVEMENT_PLAN.md P2.7).
- `/supplier` is currently an alias route and supplier-facing work lives under `/tedarikci`.
- Public assets are routed through infra, not directly through ad hoc frontend path logic.
- Response validation is used **per handler**, not globally — `lambdaHandler`'s `responseValidator` is optional. When adding or changing an endpoint, verify what that specific `actions.ts` wires, and keep the Zod schema in sync with the handler's actual output.
- Open technical work is tracked in IMPROVEMENT_PLAN.md; completed slices and their rationale are archived in IMPROVEMENT_LOG.md.

## Documentation Strategy
- `AGENTS.md`
  General implementation rules for contributors and coding agents.
- `ARCHITECTURE.md`
  Project-specific system structure, request flows, and boundaries.
- `PROJECT_OVERVIEW.md`
  Short cross-index of the above plus a table of code-verified surfaces.
- `IMPROVEMENT_PLAN.md`
  Open (not-yet-done) technical work only.
- `IMPROVEMENT_LOG.md`
  Dated archive of completed slices — what changed, why, how it was verified.

If this file grows too large, split deeper topics into focused documents such as:
- `docs/authentication.md`
- `docs/approval-workflow.md`
- `docs/frontend-patterns.md`
- `docs/data-model.md`
