---
name: add-response-validator
description: Add a Zod-based response validator (and missing request validators) to an actions.ts file in packages/functions, following this repo's exact validatorWrapper + z.toJSONSchema envelope pattern. Use this whenever the task involves adding, completing, or fixing request/response validation on a Lambda endpoint — including phrases like "responseValidator ekle", "validator eksik", "P1.2", "response validation tamamla", or when touching any of the 9 known validator-less actions files listed in IMPROVEMENT_PLAN.md.
---

# Add Response Validator

Add response (and request) validators to Lambda `actions.ts` files without breaking working endpoints. The #1 risk of this task: **a validator written narrower than the real response turns a working endpoint into a 500**. Every step below exists to prevent that.

## The repo's exact pattern (do not invent alternatives)

Validators live at `packages/functions/src/<Boundary>/validators/<domain>.ts` (boundary-level, NOT inside the function folder). Reference implementation: `packages/functions/src/AdminApi/validators/colors.ts` — read it before writing anything.

**Request validator** — Zod schema wrapped by `validatorWrapper`:

```ts
import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const getXValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid() }),
    }),
    { requiredRootFields: ["pathParameters"] },
)
```

**Response validator** — Zod schema converted to JSON Schema via Zod 4's native `z.toJSONSchema`, matching the `apiResponse`/`apiResponseDTO` envelope, with `.loose()` at the top level:

```ts
const xSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.string(),   // Dates arrive as ISO strings (apiResponse normalizes them)
    updatedAt: z.string(),
})

export const xResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ x: xSchema }),
        }),
    }).loose()
)
```

**Wiring** — in `actions.ts`, pass into `lambdaHandler` opts:

```ts
export const getX = lambdaHandler(handlerFn, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: getXValidator,
    responseValidator: xResponseValidator,
})
```

## Process — follow in order

### 1. Inventory the endpoint's real response shape
Read, in this order:
- the handler(s) in `handlers/` — what does it pass to `apiResponse`/`apiResponseDTO`?
- the repository call in `packages/core/src/core/helpers/prisma/**` — the Prisma `select`/`include` determines the exact field set, including nullable fields and relations.
- the Prisma schema for the model — note `?` (nullable) fields, enums, and Decimal/Date types.

Do NOT write the schema from what the field "should" be — write it from what the code actually returns.

### 2. Check the frontend consumer BEFORE writing the validator
Find the consuming API module in `packages/frontend/features/**/api/` (verb-named files like `getX.ts`). The validator must be at least as wide as what the frontend reads. If frontend types and the handler disagree, stop and surface the mismatch instead of guessing.

### 3. Write the schema — err on the permissive side
- Top-level envelope always `.loose()` (matches existing convention; tolerates headers/extra keys).
- Nullable Prisma field → `z.string().nullable()` (or `.nullish()` if the select sometimes omits it). When unsure between optional and required, choose optional — a too-strict validator breaks production responses, a too-loose one merely validates less.
- `Date` fields → `z.string()` (never `z.date()`; serialization happens before validation).
- Prisma `Decimal` → check how the handler serializes it (usually string) before choosing.
- Enums → copy values verbatim from `schema.prisma`, don't retype from memory.
- List endpoints: mirror the existing list validator pattern in the same boundary (e.g. `listColorResponseValidator`) including any pagination wrapper.

### 4. Wire and verify locally — kubi stage only
Testing rule for this repo: verify ONLY against `npx sst dev --stage kubi` with the local Docker Postgres (`ceyhunlar-postgres` container). Never against `dev` or `prod` stages.

- Call the endpoint through the running local stage (or exercise the UI flow that hits it).
- A response validation failure surfaces as a 500 from the middy validator — if that happens, the schema is narrower than reality; widen it, don't "fix" the handler.
- Check both the single-item and list variants, and at least one record with nullable fields populated as null.

### 5. Keep the change reviewable
One domain (one actions.ts) per commit/PR. Update the validator and the actions wiring in the same change — never land an exported validator that nothing uses.

## Known backlog
The 9 validator-less `actions.ts` files (and 2 missing requestValidators) are listed in IMPROVEMENT_PLAN.md § P1.2. When asked to "continue validator work", pick the next unfinished one from that list.
