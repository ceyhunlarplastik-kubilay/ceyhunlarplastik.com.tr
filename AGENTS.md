# AGENTS.md

## Purpose
This file defines the engineering rules and architectural expectations for AI agents and contributors working in this monorepo.

The goal is to preserve the current modular structure, keep the codebase scalable, and ensure new work follows the same patterns already used in the project.

## Stack
- SST Ion v3
- AWS Lambda + ApiGatewayV2
- Next.js App Router
- React 19
- TypeScript
- Prisma + PostgreSQL
- shadcn/ui
- motion/react
- lucide-react
- TanStack Query
- Zod
- React Hook Form
- nuqs
- Zustand

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
- `infra/approvalWorkflow.ts`
- `infra/userAccessLifecycle.ts`

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

### Tables
- Prefer simple table composition for small static tables.
- Prefer TanStack Table for complex operational tables with evolving requirements such as sorting, filtering, expansion, visibility control, or column-level behaviors.
- Keep row rendering components isolated when table complexity grows.
- Avoid burying table orchestration, filters, and row details inside a single large page component.

## Backend Rules

### Entry points
Lambda entrypoints live in `packages/functions/src/**`.
Group them by execution boundary:
- `PublicApi`
- `ProtectedApi`
- `AdminApi`
- `OwnerApi`
- workflow-specific folders like `SupplierApprovalWorkflow`

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
- auth-derived role flags and user capability checks such as `isOwner`, `isAdmin`, `isSupplier`, `isPurchasing`, `isSales`

When adding new backend functionality, first ask whether it belongs in:
- a repository
- a shared domain helper
- a mapper/transformer
- a Lambda handler

Do not skip the established helper/repository layers just because a handler can technically do the work inline.

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
Use SST v3 patterns already present in the repo.

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

For user access lifecycle and notifications:
- prefer `Bus + Realtime + SES` style fan-out for role/access change notifications
- keep Cognito group changes, DB access-status changes, and event publication coordinated through a shared domain helper
- do not scatter Cognito group mutation logic across multiple handlers

### Access lifecycle
- Treat the application database as the normalized source of truth for user access state after Cognito authentication succeeds.
- The default `user` group is a no-panel role and should not grant admin/protected workspace access.
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

### Animations
Use `motion/react` sparingly and intentionally:
- feedback for refresh/loading
- subtle reveal/transition states
- no decorative motion that harms clarity

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
