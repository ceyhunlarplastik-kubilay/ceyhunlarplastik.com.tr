import "dotenv/config"

import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const DEFAULT_LOCALE = "tr"
const BATCH_SIZE = 100

type EntityFilter = "all" | "measurement-types" | "materials" | "colors"

function parseEntityFilter(value: string | undefined): EntityFilter {
    if (!value) return "all"
    if (
        value === "all" ||
        value === "measurement-types" ||
        value === "materials" ||
        value === "colors"
    ) {
        return value
    }
    throw new Error("--entity must be one of: all, measurement-types, materials, colors")
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
    console.log(process.env.DIRECT_URL);
    console.log(process.env.DATABASE_URL);

    console.log([
        "Backfill missing Turkish MeasurementTypeTranslation, MaterialTranslation, and ColorTranslation rows.",
        "",
        "Usage:",
        "  npm --workspace packages/core run backfill:variant-dictionary-translations",
        "  npm --workspace packages/core run backfill:variant-dictionary-translations -- --dry-run",
        "  npm --workspace packages/core run backfill:variant-dictionary-translations -- --apply",
        "",
        "Options:",
        "  --dry-run        Show missing/divergent rows without writing (default)",
        "  --apply          Create missing TR translation rows",
        "  --entity <name>  all, measurement-types, materials, or colors (default: all)",
        "  --limit <number> Limit inspected rows per selected entity",
        "  -h, --help       Show this help",
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

async function backfillMeasurementTypes({
    prisma,
    apply,
    limit,
}: {
    prisma: PrismaClient
    apply: boolean
    limit?: number
}) {
    const measurementTypes = await prisma.measurementType.findMany({
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
        orderBy: [
            { displayOrder: "asc" },
            { code: "asc" },
        ],
        take: limit,
    })
    const missing = measurementTypes.filter((measurementType) => measurementType.translations.length === 0)
    const divergent = measurementTypes.filter((measurementType) => {
        const translation = measurementType.translations[0]
        return translation && translation.name !== measurementType.name
    })

    console.log(JSON.stringify({
        entity: "MeasurementType",
        mode: apply ? "apply" : "dry-run",
        locale: DEFAULT_LOCALE,
        measurementTypes: measurementTypes.length,
        missing: missing.length,
        divergent: divergent.length,
    }, null, 2))

    if (divergent.length > 0) {
        console.warn("Existing TR measurement type translations differ from legacy MeasurementType fields; they were not overwritten.")
        console.table(divergent.map((measurementType) => ({
            code: measurementType.code,
            legacyName: measurementType.name,
            translationName: measurementType.translations[0]?.name,
        })))
    }

    if (!apply || missing.length === 0) return

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
        const batch = missing.slice(offset, offset + BATCH_SIZE)

        await prisma.measurementTypeTranslation.createMany({
            data: batch.map((measurementType) => ({
                measurementTypeId: measurementType.id,
                locale: DEFAULT_LOCALE,
                name: measurementType.name,
            })),
            skipDuplicates: true,
        })

        console.log(`Backfilled measurement types ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
    }
}

async function backfillMaterials({
    prisma,
    apply,
    limit,
}: {
    prisma: PrismaClient
    apply: boolean
    limit?: number
}) {
    const materials = await prisma.material.findMany({
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
        orderBy: [
            { name: "asc" },
            { id: "asc" },
        ],
        take: limit,
    })
    const missing = materials.filter((material) => material.translations.length === 0)
    const divergent = materials.filter((material) => {
        const translation = material.translations[0]
        return translation && translation.name !== material.name
    })

    console.log(JSON.stringify({
        entity: "Material",
        mode: apply ? "apply" : "dry-run",
        locale: DEFAULT_LOCALE,
        materials: materials.length,
        missing: missing.length,
        divergent: divergent.length,
    }, null, 2))

    if (divergent.length > 0) {
        console.warn("Existing TR material translations differ from legacy Material fields; they were not overwritten.")
        console.table(divergent.map((material) => ({
            code: material.code,
            legacyName: material.name,
            translationName: material.translations[0]?.name,
        })))
    }

    if (!apply || missing.length === 0) return

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
        const batch = missing.slice(offset, offset + BATCH_SIZE)

        await prisma.materialTranslation.createMany({
            data: batch.map((material) => ({
                materialId: material.id,
                locale: DEFAULT_LOCALE,
                name: material.name,
            })),
            skipDuplicates: true,
        })

        console.log(`Backfilled materials ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
    }
}

async function backfillColors({
    prisma,
    apply,
    limit,
}: {
    prisma: PrismaClient
    apply: boolean
    limit?: number
}) {
    const colors = await prisma.color.findMany({
        select: {
            id: true,
            system: true,
            code: true,
            name: true,
            translations: {
                where: { locale: DEFAULT_LOCALE },
                select: { name: true },
                take: 1,
            },
        },
        orderBy: [
            { system: "asc" },
            { code: "asc" },
        ],
        take: limit,
    })
    const missing = colors.filter((color) => color.translations.length === 0)
    const divergent = colors.filter((color) => {
        const translation = color.translations[0]
        return translation && translation.name !== color.name
    })

    console.log(JSON.stringify({
        entity: "Color",
        mode: apply ? "apply" : "dry-run",
        locale: DEFAULT_LOCALE,
        colors: colors.length,
        missing: missing.length,
        divergent: divergent.length,
    }, null, 2))

    if (divergent.length > 0) {
        console.warn("Existing TR color translations differ from legacy Color fields; they were not overwritten.")
        console.table(divergent.map((color) => ({
            system: color.system,
            code: color.code,
            legacyName: color.name,
            translationName: color.translations[0]?.name,
        })))
    }

    if (!apply || missing.length === 0) return

    for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
        const batch = missing.slice(offset, offset + BATCH_SIZE)

        await prisma.colorTranslation.createMany({
            data: batch.map((color) => ({
                colorId: color.id,
                locale: DEFAULT_LOCALE,
                name: color.name,
            })),
            skipDuplicates: true,
        })

        console.log(`Backfilled colors ${Math.min(offset + batch.length, missing.length)}/${missing.length}`)
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
    const apply = values.apply === true
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: getConnectionString() }),
        log: ["error"],
    })

    try {
        if (entity === "all" || entity === "measurement-types") {
            await backfillMeasurementTypes({ prisma, apply, limit })
        }
        if (entity === "all" || entity === "materials") {
            await backfillMaterials({ prisma, apply, limit })
        }
        if (entity === "all" || entity === "colors") {
            await backfillColors({ prisma, apply, limit })
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
