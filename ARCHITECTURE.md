# ARCHITECTURE.md

## Purpose
This document explains the current technical architecture of the `ceyhunlarweb` monorepo.

Use this file for project-specific system design, boundaries, request flows, and extension points.
Use `AGENTS.md` for general engineering rules and implementation conventions.

This is a living document. Keep it aligned with the actual codebase instead of treating it as an aspirational design.

## System Overview
The system is a monorepo built around SST Ion v3 on AWS.

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
- PostgreSQL on RDS
- S3 for public assets
- EventBridge + Step Functions for human approval workflow orchestration

## Monorepo Boundaries

### `infra/`
Infrastructure files are the composition root of the system.

Key modules:
- `sst.config.ts`
  Main SST entrypoint. Loads the infra modules and defines stage behavior.
- `infra/db.ts`
  VPC and PostgreSQL definitions.
- `infra/cognito.ts`
  Cognito User Pool, app client, groups, and hosted UI domain wiring.
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
- `infra/approvalWorkflow.ts`
  Step Functions + EventBridge supplier approval workflow resources.

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
- `nuqs` for URL query state
- `shadcn/ui` primitives for UI consistency

### `packages/functions`
This package contains Lambda entrypoints organized by execution boundary instead of by shared domain.

Current boundaries include:
- `PublicApi`
- `ProtectedApi`
- `AdminApi`
- `OwnerApi`
- workflow-specific folders such as `SupplierApprovalWorkflow`
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
`infra/db.ts` creates:
- an SST VPC
- an SST Postgres instance
- a linked `DATABASE_URL`
- a local Prisma Studio dev command

Notable implementation detail:
- Lambdas linked to the VPC do not have default public internet access.
- This matters for any future AWS public endpoint usage from inside VPC-backed functions.
- RDS Proxy is currently disabled for cost reasons.

### Authentication
`infra/cognito.ts` defines:
- Cognito User Pool
- Cognito app client
- hosted UI domain configuration
- Cognito groups:
  `owner`, `admin`, `user`, `supplier`, `purchasing`, `sales`
- a `postConfirmation` trigger Lambda linked to RDS

Frontend authentication is handled by NextAuth with Cognito.
Admin and protected API requests currently send the Cognito `idToken` as the bearer token.

That is a real current implementation detail and should be preserved unless the auth model is intentionally changed.

### Frontend deployment
`infra/frontend.ts` deploys the Next.js app through `sst.aws.Nextjs`.

The frontend receives environment values for:
- stage
- domain
- region
- NextAuth config
- Cognito config
- public/admin/protected API base URLs
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

### Workflow orchestration
`infra/approvalWorkflow.ts` defines the supplier approval workflow.

Current design:
- a dedicated EventBridge bus
- a Step Functions state machine
- a Lambda used with task token integration to register a pending approval wait state
- requested, approved, and rejected events published onto the bus

Current operational model:
- supplier actions create approval requests and start the workflow
- Step Functions waits for a human decision
- the admin decision updates the database synchronously in the API layer
- the workflow is then resumed and publishes the final event

This is important: the database status update is not treated as eventual workflow side effect anymore. It happens at the admin decision boundary.

## Frontend Architecture

### App Router structure
The frontend uses route groups and persona-specific sections.

Important route segments currently include:
- `app/(public)`
  Public SEO-facing pages
- `app/admin`
  Admin panel
- `app/satinalma`
  Purchasing-facing routes
- `app/satis`
  Sales-facing routes
- `app/tedarikci`
  Supplier-facing workspace
- `app/supplier`
  Redirect/alias route currently pointing to supplier pages
- `app/api/auth`
  NextAuth route handlers

Keep SEO-critical public pages server-rendered whenever possible.
Use client components as leaf nodes rather than converting entire public routes to client rendering.

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
- Cognito provider
- refresh token flow against Cognito token endpoint
- group extraction from Cognito token payload
- session exposes `idToken`, `accessToken`, and `groups`

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
- logging
- error handling

New HTTP Lambdas should use `lambdaHandler` unless there is a strong reason not to.

### Auth middleware
`packages/core/src/core/middleware/authMiddleware.ts` performs:
- Cognito claim extraction
- group normalization and parsing
- automatic user creation on first authenticated request
- group synchronization between Cognito and the database
- `isActive` guard
- derived role flags on `event.user`
- permission checking with role hierarchy for core roles

This middleware is a central architectural decision.
It means the application database becomes the normalized user context source after Cognito authentication is accepted.

### Current role model
Derived booleans currently include:
- `isOwner`
- `isAdmin`
- `isSupplier`
- `isPurchasing`
- `isSales`

Keep these flags consistent across frontend assumptions, middleware output, and API permission checks.

## Core and Data Layer

### Prisma access
`packages/core/src/core/db/prisma.ts` creates the Prisma client using SST resource linkage to the RDS instance.

Current notable behavior:
- Prisma uses the SST-provided database credentials
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
- supplier approval domain logic in `packages/core/src/core/helpers/supplierApproval`

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

### Supplier approval flow
Current supplier approval lifecycle:
1. Supplier submits a profile or variant pricing change request.
2. Protected API creates a `SupplierApprovalRequest`.
3. The API starts the `SupplierApprovalWorkflow` Step Functions execution.
4. The workflow publishes `supplier-approval.requested`.
5. The workflow registers a task token and waits for decision.
6. Admin sees the pending item in the approval UI.
7. Admin approve/reject action updates the database synchronously.
8. Admin action resumes the workflow via task token.
9. Workflow publishes approved or rejected event and completes.

This split is intentional:
- request persistence and final DB status change happen in API/application logic
- workflow orchestration handles human waiting and event publication

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
- The project currently targets Node `>=22 <23` at the workspace level.
- Some Cognito trigger Lambdas still use `nodejs20.x` runtime in infra.
- `/supplier` is currently an alias route and supplier-facing work lives under `/tedarikci`.
- Public assets are routed through infra, not directly through ad hoc frontend path logic.
- Response validation is actively used in parts of the backend, so response shapes must match their validators.

## Documentation Strategy
- `AGENTS.md`
  General implementation rules for contributors and coding agents.
- `ARCHITECTURE.md`
  Project-specific system structure, request flows, and boundaries.

If this file grows too large, split deeper topics into focused documents such as:
- `docs/authentication.md`
- `docs/approval-workflow.md`
- `docs/frontend-patterns.md`
- `docs/data-model.md`
