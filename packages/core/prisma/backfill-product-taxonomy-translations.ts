import "dotenv/config"

import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const DEFAULT_LOCALE = "tr"
const BATCH_SIZE = 100

type EntityFilter = "all" | "attributes" | "values"

function parseEntityFilter(value: string | undefined): EntityFilter {
    if (!value) return "all"
    if (value === "attributes" || value === "values" || value === "all") return value
    throw new Error("--entity must be one of: all, attributes, values")
}

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
        "Backfill missing Turkish ProductAttributeTranslation and ProductAttributeValueTranslation rows.",
        "",
        "Usage:",
        "  npm --workspace packages/core run backfill:product-taxonomy-translations",
        "  npm --workspace packages/core run backfill:product-taxonomy-translations -- --dry-run",
        "  npm --workspace packages/core run backfill:product-taxonomy-translations -- --apply",
        "",
        "Options:",
        "  --dry-run              Show missing/divergent rows without writing (default)",
        "  --apply                Create missing TR translation rows",
        "  --entity <name>        all, attributes, or values (default: all)",
        "  --limit <number>       Limit inspected rows per selected entity",
        "  --attribute-code <code> Restrict values to one ProductAttribute.code",
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

async function backfillAttributes({
    prisma,
    apply,
    limit,
}: {
    prisma: PrismaClient
    apply: boolean
    limit?: number
}) {
    const attributes = await prisma.productAttribute.findMany({
        select: {
            id: true,
            code: true,
            name: true,
            translations: {
                where: { locale: DEFAULT_LOCALE },
                select: { name: true },
                take: 1,
            },
        },
        orderBy: { displayOrder: "asc" },
        take: limit,
    })
    const missing = attributes.filter((attribute) => attribute.translations.length === 0)
    const divergent = attributes.filter((attribute) => {
        const translation = attribute.translations[0]
        return translation && translation.name !== attribute.name
    })

    console.log(JSON.stringify({
        entity: "ProductAttribute",
        mode: apply ? "apply" : "dry-run",
        locale: DEFAULT_LOCALE,
        attributes: attributes.length,
        missing: missing.length,
        divergent: divergent.length,
    }, null, 2))

    if (divergent.length > 0) {
        console.warn("Existing TR attribute translations differ from legacy ProductAttribute fields; they were not overwritten.")
        console.table(divergent.map((attribute) => ({
            code: attribute.code,
            legacyName: attribute.name,
            translationName: attribute.translations[0]?.name,
        })))
    }

    if (!apply || missing.length === 0) return

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
        const batch = missing.slice(offset, offset + BATCH_SIZE)

        await prisma.productAttributeTranslation.createMany({
            data: batch.map((attribute) => ({
                productAttributeId: attribute.id,
                locale: DEFAULT_LOCALE,
                name: attribute.name,
            })),
            skipDuplicates: true,
        })

        console.log(`Backfilled attributes ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
    }
}

async function backfillValues({
    prisma,
    apply,
    limit,
    attributeCode,
}: {
    prisma: PrismaClient
    apply: boolean
    limit?: number
    attributeCode?: string
}) {
    const values = await prisma.productAttributeValue.findMany({
        where: attributeCode ? { attribute: { code: attributeCode } } : undefined,
        select: {
            id: true,
            attributeId: true,
            name: true,
            slug: true,
            attribute: {
                select: { code: true },
            },
            translations: {
                where: { locale: DEFAULT_LOCALE },
                select: { name: true, slug: true },
                take: 1,
            },
        },
        orderBy: [
            { attribute: { displayOrder: "asc" } },
            { displayOrder: "asc" },
            { name: "asc" },
        ],
        take: limit,
    })
    const missing = values.filter((value) => value.translations.length === 0)
    const divergent = values.filter((value) => {
        const translation = value.translations[0]
        return translation && (
            translation.name !== value.name ||
            translation.slug !== value.slug
        )
    })

    console.log(JSON.stringify({
        entity: "ProductAttributeValue",
        mode: apply ? "apply" : "dry-run",
        locale: DEFAULT_LOCALE,
        values: values.length,
        missing: missing.length,
        divergent: divergent.length,
    }, null, 2))

    if (divergent.length > 0) {
        console.warn("Existing TR value translations differ from legacy ProductAttributeValue fields; they were not overwritten.")
        console.table(divergent.map((value) => ({
            attributeCode: value.attribute.code,
            legacyName: value.name,
            translationName: value.translations[0]?.name,
            legacySlug: value.slug,
            translationSlug: value.translations[0]?.slug,
        })))
    }

    if (!apply || missing.length === 0) return

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
        const batch = missing.slice(offset, offset + BATCH_SIZE)

        await prisma.productAttributeValueTranslation.createMany({
            data: batch.map((value) => ({
                productAttributeValueId: value.id,
                attributeId: value.attributeId,
                locale: DEFAULT_LOCALE,
                name: value.name,
                slug: value.slug,
            })),
            skipDuplicates: true,
        })

        console.log(`Backfilled values ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
    }
}

async function main() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: false,
        strict: true,
        options: {
            apply: { type: "boolean" },
            "dry-run": { type: "boolean" },
            entity: { type: "string" },
            limit: { type: "string" },
            "attribute-code": { type: "string" },
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

    const entity = parseEntityFilter(values.entity)
    const limit = parsePositiveInteger(values.limit, "--limit")
    const attributeCode = values["attribute-code"]?.trim() || undefined
    const apply = values.apply === true
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: getConnectionString() }),
        log: ["error"],
    })

    try {
        if (entity === "all" || entity === "attributes") {
            await backfillAttributes({ prisma, apply, limit })
        }
        if (entity === "all" || entity === "values") {
            await backfillValues({ prisma, apply, limit, attributeCode })
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
