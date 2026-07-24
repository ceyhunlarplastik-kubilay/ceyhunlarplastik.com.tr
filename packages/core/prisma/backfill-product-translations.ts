import "dotenv/config"

import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const DEFAULT_LOCALE = "tr"
const BATCH_SIZE = 100

function parsePositiveInteger(value: string | undefined, label: string) {
    if (value === undefined) return undefined

    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a positive integer`)
    }

    return parsed
}

function printHelp() {
    console.log([
        "Backfill missing Turkish ProductTranslation rows from legacy Product fields.",
        "",
        "Usage:",
        "  npm --workspace packages/core run backfill:product-translations",
        "  npm --workspace packages/core run backfill:product-translations -- --dry-run",
        "  npm --workspace packages/core run backfill:product-translations -- --apply",
        "",
        "Options:",
        "  --dry-run              Show missing/divergent rows without writing (default)",
        "  --apply                Create missing TR translation rows",
        "  --limit <number>       Limit inspected rows",
        "  --product-id <id>      Restrict to one Product.id",
        "  --product-code <code>  Restrict to one Product.code",
        "  --category-id <id>     Restrict to one Product.categoryId",
        "  --category-code <code> Restrict to one Category.code",
        "  -h, --help             Show this help",
        "",
        "Existing translation rows are never overwritten.",
    ].join("\n"))
}

function getConnectionString() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error("DIRECT_URL or DATABASE_URL is required")
    }
    return connectionString
}

async function main() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: false,
        strict: true,
        options: {
            apply: { type: "boolean" },
            "dry-run": { type: "boolean" },
            limit: { type: "string" },
            "product-id": { type: "string" },
            "product-code": { type: "string" },
            "category-id": { type: "string" },
            "category-code": { type: "string" },
            help: { type: "boolean", short: "h" },
        },
    })

    if (values.help) {
        printHelp()
        return
    }

    if (values.apply && values["dry-run"]) {
        throw new Error("Use either --apply or --dry-run, not both")
    }

    const apply = values.apply === true
    const limit = parsePositiveInteger(values.limit, "--limit")
    const categoryCode = parsePositiveInteger(values["category-code"], "--category-code")
    const productId = values["product-id"]?.trim() || undefined
    const productCode = values["product-code"]?.trim() || undefined
    const categoryId = values["category-id"]?.trim() || undefined
    const where = {
        ...(productId && { id: productId }),
        ...(productCode && { code: productCode }),
        ...(categoryId && { categoryId }),
        ...(categoryCode && { category: { code: categoryCode } }),
    }
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: getConnectionString() }),
        log: ["error"],
    })

    try {
        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                code: true,
                name: true,
                slug: true,
                description: true,
                translations: {
                    where: { locale: DEFAULT_LOCALE },
                    select: {
                        name: true,
                        slug: true,
                        description: true,
                    },
                    take: 1,
                },
            },
            orderBy: { code: "asc" },
            take: limit,
        })

        if ((productId || productCode) && products.length === 0) {
            throw new Error("Requested product was not found")
        }

        const missing = products.filter((product) => product.translations.length === 0)
        const divergent = products.filter((product) => {
            const translation = product.translations[0]
            return translation && (
                translation.name !== product.name ||
                translation.slug !== product.slug ||
                (translation.description ?? null) !== (product.description ?? null)
            )
        })

        console.log(JSON.stringify({
            entity: "Product",
            mode: apply ? "apply" : "dry-run",
            locale: DEFAULT_LOCALE,
            products: products.length,
            missing: missing.length,
            divergent: divergent.length,
        }, null, 2))

        if (divergent.length > 0) {
            console.warn("Existing TR product translations differ from legacy Product fields; they were not overwritten.")
            console.table(divergent.map((product) => ({
                code: product.code,
                legacyName: product.name,
                translationName: product.translations[0]?.name,
                legacySlug: product.slug,
                translationSlug: product.translations[0]?.slug,
            })))
        }

        if (!apply || missing.length === 0) return

        for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
            const batch = missing.slice(offset, offset + BATCH_SIZE)

            await prisma.productTranslation.createMany({
                data: batch.map((product) => ({
                    productId: product.id,
                    locale: DEFAULT_LOCALE,
                    name: product.name,
                    slug: product.slug,
                    description: product.description ?? null,
                })),
                skipDuplicates: true,
            })

            console.log(`Backfilled products ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
        }

        const remaining = await prisma.product.count({
            where: {
                ...where,
                translations: {
                    none: { locale: DEFAULT_LOCALE },
                },
            },
        })

        if (remaining > 0) {
            throw new Error(`${remaining} products still have no TR translation`)
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
