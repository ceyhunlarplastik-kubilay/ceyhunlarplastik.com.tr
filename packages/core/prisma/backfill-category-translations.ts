import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const DEFAULT_LOCALE = "tr"
const BATCH_SIZE = 100
const args = process.argv.slice(2)
const allowedArgs = new Set(["--apply", "--dry-run", "--help"])

const apply = args.includes("--apply")
const dryRun = args.includes("--dry-run")
const showHelp = args.includes("--help")
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const prisma = connectionString
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
        log: ["error"],
    })
    : null

async function main() {
    const unknownArgs = args.filter((arg) => !allowedArgs.has(arg))

    if (unknownArgs.length > 0) {
        throw new Error(`Unknown arguments: ${unknownArgs.join(", ")}`)
    }

    if (apply && dryRun) {
        throw new Error("Use either --apply or --dry-run, not both")
    }

    if (showHelp) {
        console.log([
            "Backfill missing Turkish CategoryTranslation rows from legacy Category fields.",
            "",
            "Usage:",
            "  npm --workspace packages/core run backfill:category-translations",
            "  npm --workspace packages/core run backfill:category-translations -- --dry-run",
            "  npm --workspace packages/core run backfill:category-translations -- --apply",
            "",
            "The default mode is dry-run. Existing translation rows are never overwritten.",
        ].join("\n"))
        return
    }

    if (!prisma) {
        throw new Error("DIRECT_URL or DATABASE_URL is required")
    }

    const categories = await prisma.category.findMany({
        select: {
            id: true,
            code: true,
            name: true,
            slug: true,
            translations: {
                where: { locale: DEFAULT_LOCALE },
                select: { name: true, slug: true },
                take: 1,
            },
        },
        orderBy: { code: "asc" },
    })

    const missing = categories.filter((category) => category.translations.length === 0)
    const divergent = categories.filter((category) => {
        const translation = category.translations[0]
        return translation && (
            translation.name !== category.name ||
            translation.slug !== category.slug
        )
    })

    console.log(JSON.stringify({
        mode: apply ? "apply" : "dry-run",
        locale: DEFAULT_LOCALE,
        categories: categories.length,
        missing: missing.length,
        divergent: divergent.length,
    }, null, 2))

    if (divergent.length > 0) {
        console.warn("Existing TR translations differ from legacy Category fields; they were not overwritten.")
        console.table(divergent.map((category) => ({
            code: category.code,
            legacyName: category.name,
            translationName: category.translations[0]?.name,
            legacySlug: category.slug,
            translationSlug: category.translations[0]?.slug,
        })))
    }

    if (!apply || missing.length === 0) return

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
        const batch = missing.slice(offset, offset + BATCH_SIZE)

        await prisma.categoryTranslation.createMany({
            data: batch.map((category) => ({
                categoryId: category.id,
                locale: DEFAULT_LOCALE,
                name: category.name,
                slug: category.slug,
            })),
            skipDuplicates: true,
        })

        console.log(`Backfilled ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
    }

    const remaining = await prisma.category.count({
        where: {
            translations: {
                none: { locale: DEFAULT_LOCALE },
            },
        },
    })

    if (remaining > 0) {
        throw new Error(`${remaining} categories still have no TR translation`)
    }

    console.log("TR category translation backfill completed")
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma?.$disconnect()
    })
