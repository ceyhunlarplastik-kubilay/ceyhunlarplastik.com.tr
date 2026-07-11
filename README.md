# Ceyhunlar Plastik — SST v3 Monorepo

An SST v3 monorepo application built with AWS Lambda, API Gateway V2, Cognito, PostgreSQL via Prisma, and stage-aware infrastructure. Production uses AWS RDS inside a VPC; non-production stages use Neon Postgres to keep local development lightweight. [Learn more about SST monorepos](https://sst.dev/docs/set-up-a-monorepo).

---

## Project Structure

This template uses [npm Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) with 3 packages:

| Package | Description |
|---|---|
| `packages/core/` | Shared code: Prisma client, repositories, helpers, validators |
| `packages/functions/` | Lambda handler functions (AdminApi, PublicApi, Cognito triggers, etc.) |
| `packages/scripts/` | One-off scripts that can be run via `sst shell` with `tsx` |

The `infra/` directory splits AWS infrastructure into logical files:

| File | Description |
|---|---|
| `infra/db.ts` | Stage-aware database wiring: prod VPC/RDS, non-prod Neon, Prisma DevCommand |
| `infra/cognito.ts` | Cognito User Pool, Groups (owner/admin/user), OAuth client |
| `infra/AdminApi.ts` | Admin API Gateway (JWT-protected) |
| `infra/PublicApi.ts` | Public-facing API |
| `infra/ProtectedApi.ts` | Protected API |
| `infra/OwnerApi.ts` | Owner-level API |

---

## Prerequisites

- Node.js (see `.nvmrc`)
- AWS CLI configured with a named profile (e.g. `ceyhunlar-prod`)
- Neon Postgres project for non-production stages (`kubi`, `dev`)
- Docker only if you need to dump/import the legacy local Postgres container
- `sudo npx sst tunnel install` (once, only for production RDS access)

---

## Environment Variables

Set the following in the **root `.env`** file (not `packages/core/.env`):

```bash
// AWS_REGION="eu-west-1"
AWS_REGION="eu-central-1" => for prod
HOSTED_ZONE_ID="your-route53-hosted-zone-id"
DOMAIN="yourdomain.com"
RDS_PASSWORD="your-strong-rds-password"
```

> The `packages/core/.env` file is **only used by Prisma CLI when you run Prisma directly from `packages/core`**. Runtime database access is provided through SST links: prod receives RDS connection fields, non-prod receives the Neon pooled URL.

For non-production Neon stages, set these SST secrets per stage:

```bash
npx sst secret set NeonDatabaseUrl --stage kubi
npx sst secret set NeonDirectUrl --stage kubi
```

- `NeonDatabaseUrl`: pooled Neon connection string, used by Lambda/Next.js runtime.
- `NeonDirectUrl`: direct Neon connection string, used by Prisma CLI, `pg_dump`, and `pg_restore`.
- Repeat the same secret names for `--stage dev` when the `dev` branch is ready. Do not use prod RDS credentials for these secrets.

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure non-prod Neon

Recommended Neon setup:

- Project: `ceyhunlar-nonprod`
- Region: `AWS Europe West 2 (London)` for the current `eu-west-1` local AWS region.
- Branches: `kubi` and `dev`
- PostgreSQL version: choose PostgreSQL 16 for the first migration if Neon offers it. The legacy `ceyhunlar-postgres` container currently runs PostgreSQL 16.4; do not combine the Docker-to-Neon migration with a major Postgres upgrade. PostgreSQL 18 should be treated as a separate, later upgrade after the import is verified.

Current migration note: the `kubi` Neon branch was created on PostgreSQL 18.4 and the PostgreSQL 16.4 Docker dump restored successfully on 2026-07-10. If a PG18-specific issue appears, recreate the non-prod Neon project on PostgreSQL 16/17 and restore the same verified dump.

The `kubi` stage should point to the Neon `kubi` branch. The `dev` stage can be prepared with secrets, but should not be deployed until intentionally needed.

### 3. Preserve and import legacy Docker data

Do not remove the `ceyhunlar-postgres` container or its Docker volume before the Neon import is verified.

First, start Docker only for the migration window and inspect the source database:

```bash
docker exec ceyhunlar-postgres psql -U postgres -d local -c "select version();"
docker exec ceyhunlar-postgres psql -U postgres -d local -c "select pg_size_pretty(pg_database_size('local'));"
```

Create a permanent custom-format backup before touching Neon:

```bash
mkdir -p "$HOME/Backups/ceyhunlar"
pg_dump -Fc --verbose --no-owner --no-acl \
  --dbname "postgresql://postgres:password@localhost:5432/local" \
  --file "$HOME/Backups/ceyhunlar/local-$(date +%Y%m%d-%H%M%S).dump"
```

Restore that dump into an empty Neon `kubi` branch using the direct, non-pooled URL:

```bash
pg_restore --verbose --exit-on-error --no-owner --no-acl \
  --dbname "$NEON_DIRECT_URL" \
  "$HOME/Backups/ceyhunlar/local-YYYYMMDD-HHMMSS.dump"
```

After restore, verify row counts and Prisma migration state before switching daily development to Neon:

```bash
cd packages/core
DIRECT_URL="$NEON_DIRECT_URL" npx prisma migrate status
```

Only after the `kubi` branch is validated should the Neon `dev` branch be created from the `kubi` snapshot.

### 4. Run migrations locally

```bash
cd packages/core
npx prisma migrate dev --name <migration-name>
npx prisma generate
cd ../..
```

> You do **not** need `sst tunnel` for `kubi` or `dev`. Non-production stages connect to Neon over the public TLS endpoint. Use `DIRECT_URL` for Prisma CLI commands when running outside `sst shell`.

### 5. Start the dev server

```bash
export AWS_PROFILE=ceyhunlar-prod
npx sst dev --stage kubi
```

> Replace `kubi` with your own personal stage name only if matching Neon secrets and a matching Neon branch exist.

### 6. (Optional) Open Prisma Studio locally

Prisma Studio is defined as a `DevCommand` in `infra/db.ts`. While `sst dev` is running:

```bash
# In a new terminal:
npx sst shell --target Prisma
# Then in that shell:
cd packages/core && npx prisma studio
```

---

## Deploying to AWS

### 1. Set your AWS profile

```bash
export AWS_PROFILE=ceyhunlar-prod
```

### 2. Deploy a stage

```bash
npx sst deploy --stage test-1
```

> Use any stage name (e.g. `test-1`, `staging`). The stage `prod` has `protect: true` and `removal: "retain"` — it cannot be removed accidentally.

---

## Database Migrations on a Deployed Stage

Production RDS runs inside a private VPC, so production Prisma CLI access requires an SST tunnel. Non-production Neon stages do not require a VPC or tunnel.

### Non-production Neon stages

Use the stage-specific Neon direct URL through `sst shell`:

```bash
npx sst shell --stage kubi --target Prisma -- bash -lc "cd packages/core && npx prisma migrate deploy"
```

### Production RDS

Do not point production at Neon. Keep using the production RDS/VPC path.

#### Step 1 — Install the tunnel (once, requires sudo)

```bash
sudo npx sst tunnel install
```

#### Step 2 — Open the tunnel (keep this terminal running)

```bash
npx sst tunnel --stage prod
```

> This requires `bastion: true` on the VPC (already configured in `infra/db.ts`).

#### Step 3 — Run migrations (in a new terminal)

```bash
npx sst shell --stage prod --target Prisma -- bash -lc "cd packages/core && npx prisma migrate deploy"
```

> Use `migrate deploy` (not `migrate dev`) for deployed stages. It applies existing migration files without resetting or creating new ones.

#### Step 4 — (Optional) Open Prisma Studio against production RDS

```bash
# Terminal 1: tunnel must be running
npx sst tunnel --stage prod

# Terminal 2: open a shell with the RDS DATABASE_URL / DIRECT_URL
npx sst shell --stage prod --target Prisma
# Inside the shell:
cd packages/core && npx prisma studio
```

---

## Tearing Down a Stage

```bash
npx sst remove --stage test-1
```

> `prod` is protected — `sst remove --stage prod` will fail by design.

---

## Authentication — Cognito

Authentication is managed via **AWS Cognito** (`infra/cognito.ts`).

### User Pool

- Sign-in method: **email**
- Email verification is sent on registration
- Three user groups with role precedence:

| Group | Precedence | Description |
|---|---|---|
| `owner` | 1 | Full access |
| `admin` | 2 | Admin panel access |
| `user` | 3 | Regular users |

### OAuth Client

- OAuth flow: `code`
- Token validity: Access/ID = 60 min, Refresh = 30 days
- Scopes: `phone`, `email`, `openid`, `profile`
- Callback URL: `{baseUrl}/api/auth/callback/cognito`

### Domains

| Stage | Cognito domain |
|---|---|
| `prod` | `auth.yourdomain.com` |
| `dev` | `auth-dev.yourdomain.com` |
| other | no custom domain |

### Post-Confirmation Trigger

When a user confirms their email (`PostConfirmation_ConfirmSignUp`), a Lambda trigger (`postConfirmation.ts`) automatically creates a `User` record in the configured PostgreSQL database:

```
Cognito confirm email
  → postConfirmation Lambda
    → Check if User exists (by cognitoSub)
      → If not: create User in DB with email, identifier, groups: ["user"]
```

In prod, the trigger runs inside the VPC and is linked to RDS. In non-prod, it is not VPC-attached and uses the Neon database link.

---

## Admin API

The Admin API (`infra/AdminApi.ts`) is an AWS API Gateway V2 protected by a **Cognito JWT Authorizer**. All routes require a valid Bearer token in the `Authorization` header.

### Domain

| Stage | Domain |
|---|---|
| `prod` | `admin.api.yourdomain.com` |
| `dev` | `admin.dev.api.yourdomain.com` |
| other | auto-assigned API Gateway URL |

### Throttling

- Rate limit: 100 req/s
- Burst limit: 200 req/s

### API Routes

#### Users
| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users |

#### Categories
| Method | Path | Description |
|---|---|---|
| POST | `/categories` | Create category |
| GET | `/categories` | List categories |
| GET | `/categories/{id}` | Get category |
| PUT | `/categories/{id}` | Update category |
| DELETE | `/categories/{id}` | Delete category |

#### Colors
| Method | Path | Description |
|---|---|---|
| POST | `/colors` | Create color |
| GET | `/colors` | List colors |
| GET | `/colors/{id}` | Get color |
| PUT | `/colors/{id}` | Update color |
| DELETE | `/colors/{id}` | Delete color |

#### Suppliers
| Method | Path | Description |
|---|---|---|
| POST | `/suppliers` | Create supplier |
| GET | `/suppliers` | List suppliers |
| GET | `/suppliers/{id}` | Get supplier |
| PUT | `/suppliers/{id}` | Update supplier |
| DELETE | `/suppliers/{id}` | Delete supplier |

#### Products
| Method | Path | Description |
|---|---|---|
| POST | `/products` | Create product |
| GET | `/products` | List products |
| GET | `/products/{id}` | Get product |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |

#### Product Variants
| Method | Path | Description |
|---|---|---|
| POST | `/product-variants` | Create variant |
| GET | `/product-variants` | List variants |
| GET | `/product-variants/{id}` | Get variant |
| PUT | `/product-variants/{id}` | Update variant |
| DELETE | `/product-variants/{id}` | Delete variant |

#### Product Variant Suppliers
| Method | Path | Description |
|---|---|---|
| POST | `/product-variant-suppliers` | Link supplier to variant |
| GET | `/product-variant-suppliers` | List variant-supplier links |
| GET | `/product-variant-suppliers/{id}` | Get link |
| PUT | `/product-variant-suppliers/{id}` | Update link |
| DELETE | `/product-variant-suppliers/{id}` | Remove link |

#### Measurement Types
| Method | Path | Description |
|---|---|---|
| POST | `/measurement-types` | Create measurement type |
| GET | `/measurement-types` | List measurement types |
| GET | `/measurement-types/{id}` | Get measurement type |
| PUT | `/measurement-types/{id}` | Update measurement type |

> Available measurement codes: `D` (Diameter), `L` (Length), `T` (Thickness), `A` (Angle), `W` (Width), `H` (Height)

#### Product Measurements
| Method | Path | Description |
|---|---|---|
| POST | `/product-measurements` | Add measurement to variant |
| GET | `/product-measurements` | List measurements |
| GET | `/product-measurements/{id}` | Get measurement |
| PUT | `/product-measurements/{id}` | Update measurement |
| DELETE | `/product-measurements/{id}` | Delete measurement |

#### Materials
| Method | Path | Description |
|---|---|---|
| POST | `/materials` | Create material |
| GET | `/materials` | List materials |
| GET | `/materials/{id}` | Get material |
| PUT | `/materials/{id}` | Update material |
| DELETE | `/materials/{id}` | Delete material |

#### Assets
| Method | Path | Description |
|---|---|---|
| POST | `/assets` | Create asset (IMAGE, VIDEO, PDF, TECHNICAL_DRAWING, CERTIFICATE) |
| GET | `/assets` | List assets |
| GET | `/assets/{id}` | Get asset |
| PUT | `/assets/{id}` | Update asset |
| DELETE | `/assets/{id}` | Delete asset |

---

## Product Variant Full Code

Variant codes follow the format: **`{ProductCode}.{SupplierCode}.{VersionCode}.{VariantIndex}`**

| Segment | Example | Description |
|---|---|---|
| `ProductCode` | `1.9` | Category.Product number |
| `SupplierCode` | `A` | Catalog supplier code (assigned per variant) |
| `VersionCode` | `V1` | Version of the variant |
| `VariantIndex` | `1` | Auto-incremented index per product+version group |

**Example:** `1.9.A.V1.1`, `1.9.A.V1.2`, `1.24.A.V1.59`

> Note: Multiple suppliers can be linked to the same variant (the `SupplierCode` is a catalog-level code, not tied to a single supplier record). The `VariantIndex` is automatically assigned on creation.

---

## Prisma

- Schema: `packages/core/prisma/schema.prisma`
- Migrations: `packages/core/prisma/migrations/`
- Config: `packages/core/prisma.config.ts`
- Generated client: `packages/core/prisma/generated/prisma/`

After any schema change, run locally:

```bash
cd packages/core
npx prisma migrate dev --name describe-your-change
npx prisma generate
```

For a deployed stage, use `migrate deploy` via `sst shell --target Prisma` as described above.

---

**SST Community** — [Discord](https://sst.dev/discord) | [YouTube](https://www.youtube.com/c/sst-dev) | [X.com](https://x.com/SST_dev)
