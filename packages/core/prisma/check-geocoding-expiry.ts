import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

/**
 * `prisma migrate status` yalnız _prisma_migrations defterine bakar.
 * Bu script kolonun ve indeksin GERÇEKTEN var olduğunu doğrular.
 *
 *   npx sst shell --stage kubi --target Prisma
 *   cd packages/core && npx tsx prisma/check-geocoding-expiry.ts
 */
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required")
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ["error"],
})

const [migration] = await prisma.$queryRaw<Array<{
    migration_name: string
    finished_at: Date | null
    rolled_back_at: Date | null
}>>`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    WHERE migration_name = '20260818120000_add_google_geocoding_expiry'
`

const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'CustomerAddress' AND column_name = 'geocodingExpiresAt'
`

const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'CustomerAddress'
      AND indexname = 'CustomerAddress_geocodingProvider_geocodingExpiresAt_idx'
`

console.log("migration kaydı:", migration ?? "YOK")
console.log("kolon:", columns[0] ?? "YOK")
console.log("indeks:", indexes[0] ?? "YOK")
console.log(
    migration?.finished_at && !migration.rolled_back_at && columns[0] && indexes[0]
        ? "\n✅ Migration uygulanmış."
        : "\n❌ Eksik var — yukarıdaki satırlara bakın.",
)

await prisma.$disconnect()
