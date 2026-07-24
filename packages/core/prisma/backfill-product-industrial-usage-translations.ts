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
        "Backfill missing Turkish ProductIndustrialUsageTranslation rows from legacy usageFunction.",
        "",
        "Usage:",
        "  npm --workspace packages/core run backfill:product-industrial-usage-translations",
        "  npm --workspace packages/core run backfill:product-industrial-usage-translations -- --dry-run",
        "  npm --workspace packages/core run backfill:product-industrial-usage-translations -- --apply",
        "",
        "Options:",
        "  --dry-run             Show missing/divergent rows without writing (default)",
        "  --apply               Create missing TR translation rows",
        "  --limit <number>      Limit inspected rows",
        "  --product-id <id>     Restrict to one Product.id",
        "  --product-code <code> Restrict to one Product.code",
        "  -h, --help            Show this help",
        "",
        "Rows with empty/null legacy usageFunction are ignored.",
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
    const productId = values["product-id"]?.trim() || undefined
    const productCode = values["product-code"]?.trim() || undefined
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: getConnectionString() }),
        log: ["error"],
    })

    try {
        const usages = await prisma.productIndustrialUsage.findMany({
            where: {
                ...(productId && { productId }),
                ...(productCode && { product: { code: productCode } }),
                usageFunction: { not: null },
            },
            select: {
                id: true,
                usageFunction: true,
                product: {
                    select: {
                        code: true,
                    },
                },
                translations: {
                    where: { locale: DEFAULT_LOCALE },
                    select: { usageFunction: true },
                    take: 1,
                },
            },
            orderBy: [
                { product: { code: "asc" } },
                { displayOrder: "asc" },
            ],
            take: limit,
        })
        const nonEmptyUsages = usages.filter((usage) => usage.usageFunction?.trim())
        const missing = nonEmptyUsages.filter((usage) => usage.translations.length === 0)
        const divergent = nonEmptyUsages.filter((usage) => {
            const translation = usage.translations[0]
            return translation && translation.usageFunction !== usage.usageFunction?.trim()
        })

        console.log(JSON.stringify({
            entity: "ProductIndustrialUsage",
            mode: apply ? "apply" : "dry-run",
            locale: DEFAULT_LOCALE,
            usages: nonEmptyUsages.length,
            ignoredEmpty: usages.length - nonEmptyUsages.length,
            missing: missing.length,
            divergent: divergent.length,
        }, null, 2))

        if (divergent.length > 0) {
            console.warn("Existing TR usage translations differ from legacy usageFunction; they were not overwritten.")
            console.table(divergent.map((usage) => ({
                productCode: usage.product.code,
                id: usage.id,
                legacyUsageFunction: usage.usageFunction,
                translationUsageFunction: usage.translations[0]?.usageFunction,
            })))
        }

        if (!apply || missing.length === 0) return

        for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
            const batch = missing.slice(offset, offset + BATCH_SIZE)

            await prisma.productIndustrialUsageTranslation.createMany({
                data: batch.map((usage) => ({
                    productIndustrialUsageId: usage.id,
                    locale: DEFAULT_LOCALE,
                    usageFunction: usage.usageFunction!.trim(),
                })),
                skipDuplicates: true,
            })

            console.log(`Backfilled product industrial usages ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
