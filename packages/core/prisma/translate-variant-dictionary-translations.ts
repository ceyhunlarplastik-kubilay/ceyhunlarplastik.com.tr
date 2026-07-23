import "dotenv/config"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"

import {
    VariantDictionaryTranslationDraftError,
    applyVariantDictionaryTranslationDraft,
    buildVariantDictionaryTranslationWrites,
    createVariantDictionaryTranslationDraft,
    parseVariantDictionaryTranslationDraft,
    type VariantDictionaryTranslationCandidate,
    type VariantDictionaryTranslationDraftStore,
} from "../src/core/helpers/variantDictionaries/variantDictionaryTranslationDraft"
import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { PrismaClient } from "./generated/prisma/client"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEFAULT_DRAFT_PATH = ".translation-drafts/variant-dictionaries-tr-en.json"
const VARIANT_DICTIONARY_TRANSLATION_CONTEXT = [
    "Bu metinler endüstriyel plastik ürün varyant tablolarında kullanılan kısa",
    "ölçü, malzeme ve renk sözlük etiketleridir. Teknik terimleri, RAL/PANTONE",
    "kodlarını ve malzeme standardı dilini koruyarak kısa ve doğal çevirin.",
].join(" ")

type CliMode = "plan" | "generate" | "apply"
type EntityFilter = "all" | "measurement-types" | "materials" | "colors"

type CliOptions = {
    mode: CliMode
    entity: EntityFilter
    applyPath?: string
    outputPath: string
    limit?: number
    showHelp: boolean
}

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

function parseCliOptions(): CliOptions {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: false,
        strict: true,
        options: {
            plan: { type: "boolean" },
            generate: { type: "boolean" },
            apply: { type: "string" },
            output: { type: "string" },
            entity: { type: "string" },
            limit: { type: "string" },
            help: { type: "boolean", short: "h" },
        },
    })

    const selectedModes: CliMode[] = []
    if (values.plan) selectedModes.push("plan")
    if (values.generate) selectedModes.push("generate")
    if (values.apply) selectedModes.push("apply")

    if (selectedModes.length > 1) {
        throw new Error("Use only one of --plan, --generate, or --apply")
    }

    const mode = selectedModes[0] ?? "plan"
    const limit = parsePositiveInteger(values.limit, "--limit")

    if (mode === "apply" && (limit || values.entity)) {
        throw new Error("--limit and --entity cannot be used with --apply")
    }

    return {
        mode,
        entity: parseEntityFilter(values.entity),
        applyPath: values.apply,
        outputPath: values.output ?? DEFAULT_DRAFT_PATH,
        limit,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log("DIRECT_URL", process.env.DIRECT_URL);
    console.log("DATABASE_URL", process.env.DATABASE_URL);
    console.log("DEEPL_API_KEY", process.env.DEEPL_API_KEY);
    console.log([
        "Generate and apply reviewed English MeasurementType/Material/Color translation drafts with DeepL.",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:variant-dictionary-translations",
        "  npm --workspace packages/core run translate:variant-dictionary-translations -- --plan",
        "  npm --workspace packages/core run translate:variant-dictionary-translations -- --generate",
        "  npm --workspace packages/core run translate:variant-dictionary-translations -- --apply .translation-drafts/variant-dictionaries-tr-en.json",
        "",
        "Options:",
        "  --plan          Show candidates without calling DeepL or writing the database (default)",
        "  --generate      Call DeepL and create a review draft without writing the database",
        "  --apply <path>   Validate and atomically apply a reviewed draft without calling DeepL",
        "  --output <path>  Draft output path (default: .translation-drafts/variant-dictionaries-tr-en.json)",
        "  --entity <name>  all, measurement-types, materials, or colors (default: all)",
        "  --limit <number> Limit rows during plan/generate",
        "  -h, --help       Show this help",
        "",
        "Environment:",
        "  DIRECT_URL or DATABASE_URL is required for all data modes.",
        "  DEEPL_API_KEY is required only for --generate.",
        "  DEEPL_GLOSSARY_ID is optional for --generate.",
        "",
        "Existing EN translations are never overwritten.",
    ].join("\n"))
}

function getConnectionString() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error("DIRECT_URL or DATABASE_URL is required")
    }
    return connectionString
}

async function loadMeasurementTypeCandidates(prisma: PrismaClient, options: Pick<CliOptions, "limit">) {
    const measurementTypes = await prisma.measurementType.findMany({
        select: {
            id: true,
            code: true,
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: { locale: true, name: true },
            },
        },
        orderBy: [
            { displayOrder: "asc" },
            { code: "asc" },
        ],
        take: options.limit,
    })
    const missingSource = measurementTypes.filter((measurementType) =>
        !measurementType.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = measurementTypes.filter((measurementType) =>
        measurementType.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = measurementTypes.flatMap<VariantDictionaryTranslationCandidate>((measurementType) => {
        const source = measurementType.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = measurementType.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                entity: "measurementType",
                measurementTypeId: measurementType.id,
                code: measurementType.code,
                sourceName: source.name,
            }]
            : []
    })

    return {
        candidates,
        missingSource,
        existingTarget,
        total: measurementTypes.length,
    }
}

async function loadMaterialCandidates(prisma: PrismaClient, options: Pick<CliOptions, "limit">) {
    const materials = await prisma.material.findMany({
        select: {
            id: true,
            code: true,
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: { locale: true, name: true },
            },
        },
        orderBy: [
            { name: "asc" },
            { id: "asc" },
        ],
        take: options.limit,
    })
    const missingSource = materials.filter((material) =>
        !material.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = materials.filter((material) =>
        material.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = materials.flatMap<VariantDictionaryTranslationCandidate>((material) => {
        const source = material.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = material.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                entity: "material",
                materialId: material.id,
                code: material.code,
                sourceName: source.name,
            }]
            : []
    })

    return {
        candidates,
        missingSource,
        existingTarget,
        total: materials.length,
    }
}

async function loadColorCandidates(prisma: PrismaClient, options: Pick<CliOptions, "limit">) {
    const colors = await prisma.color.findMany({
        select: {
            id: true,
            system: true,
            code: true,
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: { locale: true, name: true },
            },
        },
        orderBy: [
            { system: "asc" },
            { code: "asc" },
        ],
        take: options.limit,
    })
    const missingSource = colors.filter((color) =>
        !color.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = colors.filter((color) =>
        color.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = colors.flatMap<VariantDictionaryTranslationCandidate>((color) => {
        const source = color.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = color.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                entity: "color",
                colorId: color.id,
                system: color.system,
                code: color.code,
                sourceName: source.name,
            }]
            : []
    })

    return {
        candidates,
        missingSource,
        existingTarget,
        total: colors.length,
    }
}

async function loadTranslationCandidates(prisma: PrismaClient, options: CliOptions) {
    const [measurementTypeResult, materialResult, colorResult] = await Promise.all([
        options.entity === "all" || options.entity === "measurement-types"
            ? loadMeasurementTypeCandidates(prisma, options)
            : Promise.resolve({ candidates: [], missingSource: [], existingTarget: [], total: 0 }),
        options.entity === "all" || options.entity === "materials"
            ? loadMaterialCandidates(prisma, options)
            : Promise.resolve({ candidates: [], missingSource: [], existingTarget: [], total: 0 }),
        options.entity === "all" || options.entity === "colors"
            ? loadColorCandidates(prisma, options)
            : Promise.resolve({ candidates: [], missingSource: [], existingTarget: [], total: 0 }),
    ])
    const candidates = [
        ...measurementTypeResult.candidates,
        ...materialResult.candidates,
        ...colorResult.candidates,
    ]
    const estimatedCharacters = estimateTranslationCharacters(
        candidates.map(({ sourceName }) => sourceName),
    )

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        entity: options.entity,
        measurementTypes: measurementTypeResult.total,
        materials: materialResult.total,
        colors: colorResult.total,
        missingSourceMeasurementTypes: measurementTypeResult.missingSource.length,
        missingSourceMaterials: materialResult.missingSource.length,
        missingSourceColors: colorResult.missingSource.length,
        existingTargetMeasurementTypes: measurementTypeResult.existingTarget.length,
        existingTargetMaterials: materialResult.existingTarget.length,
        existingTargetColors: colorResult.existingTarget.length,
        candidates: candidates.length,
        estimatedCharacters,
    }, null, 2))

    if (candidates.length > 0) {
        console.table(candidates.map((candidate) => ({
            entity: candidate.entity,
            code: candidate.entity === "color"
                ? `${candidate.system}:${candidate.code}`
                : candidate.entity === "measurementType"
                    ? candidate.code
                    : candidate.code ?? candidate.materialId,
            sourceName: candidate.sourceName,
        })))
    }

    const missingSourceCount =
        measurementTypeResult.missingSource.length +
        materialResult.missingSource.length +
        colorResult.missingSource.length
    if (missingSourceCount > 0) {
        console.table([
            ...measurementTypeResult.missingSource.map(({ id, code }) => ({
                entity: "MeasurementType",
                code,
                id,
            })),
            ...materialResult.missingSource.map(({ id, code }) => ({
                entity: "Material",
                code,
                id,
            })),
            ...colorResult.missingSource.map(({ id, system, code }) => ({
                entity: "Color",
                code: `${system}:${code}`,
                id,
            })),
        ])
        throw new Error(
            `${missingSourceCount} variant dictionary rows have no TR translation; run and verify the TR backfill first`,
        )
    }

    return { candidates, estimatedCharacters }
}

async function generateDraft(prisma: PrismaClient, options: CliOptions) {
    const { candidates, estimatedCharacters } = await loadTranslationCandidates(prisma, options)

    if (candidates.length === 0) {
        console.log("No variant dictionary rows require an EN translation; DeepL was not called.")
        return
    }

    const apiKey = process.env.DEEPL_API_KEY?.trim()
    if (!apiKey) throw new Error("DEEPL_API_KEY is required for --generate")

    const glossaryId = process.env.DEEPL_GLOSSARY_ID?.trim() || undefined
    const translator = new DeepLTranslator({ apiKey, glossaryId })
    const usage = await translator.getUsage()

    assertDeepLQuotaAvailable(usage, estimatedCharacters)
    console.log(JSON.stringify({ deepLUsage: usage }, null, 2))

    const translations = await translator.translateTexts({
        texts: candidates.map(({ sourceName }) => sourceName),
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        context: VARIANT_DICTIONARY_TRANSLATION_CONTEXT,
    })
    const billedCharacters = translations.reduce(
        (total, translation) => total + translation.billedCharacters,
        0,
    )
    const draft = createVariantDictionaryTranslationDraft({
        candidates,
        translatedNames: translations.map(({ text }) => text),
        glossaryId,
        estimatedCharacters,
        billedCharacters,
    })
    const outputPath = path.resolve(options.outputPath)

    await mkdir(path.dirname(outputPath), { recursive: true })
    try {
        await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, {
            encoding: "utf8",
            flag: "wx",
        })
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
            throw new Error(
                `Draft already exists at ${outputPath}; preserve reviewed work and choose another --output path`,
            )
        }
        throw error
    }

    console.table(draft.entries.map((entry) => ({
        entity: entry.entity,
        code: entry.entity === "color"
            ? `${entry.system}:${entry.code}`
            : entry.entity === "measurementType"
                ? entry.code
                : entry.code ?? entry.materialId,
        sourceName: entry.source.name,
        targetName: entry.target.name,
    })))
    console.log(`Review draft created: ${outputPath}`)
    console.log("No database records were written.")
}

function createDraftStore(prisma: PrismaClient): VariantDictionaryTranslationDraftStore {
    const loadMeasurementTypes = (ids: string[]) => ids.length === 0
        ? Promise.resolve([])
        : prisma.measurementType.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                code: true,
                translations: {
                    where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                    select: { locale: true, name: true },
                },
            },
        })
    const loadMaterials = (ids: string[]) => ids.length === 0
        ? Promise.resolve([])
        : prisma.material.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                code: true,
                translations: {
                    where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                    select: { locale: true, name: true },
                },
            },
        })
    const loadColors = (ids: string[]) => ids.length === 0
        ? Promise.resolve([])
        : prisma.color.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                system: true,
                code: true,
                translations: {
                    where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                    select: { locale: true, name: true },
                },
            },
        })

    return {
        loadMeasurementTypes,
        loadMaterials,
        loadColors,
        createManyAtomically: (writes, draft) => prisma.$transaction(async (transaction) => {
            const store = createDraftStore(transaction as unknown as PrismaClient)
            const [currentMeasurementTypes, currentMaterials, currentColors] = await Promise.all([
                store.loadMeasurementTypes(draft.entries
                    .filter((entry) => entry.entity === "measurementType")
                    .map((entry) => entry.measurementTypeId)),
                store.loadMaterials(draft.entries
                    .filter((entry) => entry.entity === "material")
                    .map((entry) => entry.materialId)),
                store.loadColors(draft.entries
                    .filter((entry) => entry.entity === "color")
                    .map((entry) => entry.colorId)),
            ])
            const currentWrites = buildVariantDictionaryTranslationWrites({
                draft,
                measurementTypes: currentMeasurementTypes,
                materials: currentMaterials,
                colors: currentColors,
            })

            if (JSON.stringify(currentWrites) !== JSON.stringify(writes)) {
                throw new VariantDictionaryTranslationDraftError(
                    "Variant dictionary translation writes changed during atomic validation",
                )
            }

            const measurementTypeResult = currentWrites.measurementTypes.length === 0
                ? { count: 0 }
                : await transaction.measurementTypeTranslation.createMany({
                    data: currentWrites.measurementTypes,
                })
            const materialResult = currentWrites.materials.length === 0
                ? { count: 0 }
                : await transaction.materialTranslation.createMany({
                    data: currentWrites.materials,
                })
            const colorResult = currentWrites.colors.length === 0
                ? { count: 0 }
                : await transaction.colorTranslation.createMany({
                    data: currentWrites.colors,
                })

            return {
                measurementTypes: measurementTypeResult.count,
                materials: materialResult.count,
                colors: colorResult.count,
            }
        }, { isolationLevel: "Serializable" }),
    }
}

async function applyDraft(prisma: PrismaClient, draftPath: string | undefined) {
    if (!draftPath) throw new Error("--apply requires a draft path")

    const absolutePath = path.resolve(draftPath)
    const content = await readFile(absolutePath, "utf8")
    let input: unknown

    try {
        input = JSON.parse(content)
    } catch {
        throw new VariantDictionaryTranslationDraftError(`Draft is not valid JSON: ${absolutePath}`)
    }

    const draft = parseVariantDictionaryTranslationDraft(input)
    console.log(JSON.stringify({
        draft: absolutePath,
        generatedAt: draft.generatedAt,
        sourceLocale: draft.sourceLocale,
        targetLocale: draft.targetLocale,
        glossaryId: draft.glossaryId,
        entries: draft.entries.length,
    }, null, 2))

    const result = await applyVariantDictionaryTranslationDraft({
        draft,
        store: createDraftStore(prisma),
    })

    console.table([
        ...result.writes.measurementTypes.map((write) => ({
            entity: "MeasurementType",
            id: write.measurementTypeId,
            name: write.name,
        })),
        ...result.writes.materials.map((write) => ({
            entity: "Material",
            id: write.materialId,
            name: write.name,
        })),
        ...result.writes.colors.map((write) => ({
            entity: "Color",
            id: write.colorId,
            name: write.name,
        })),
    ])
    console.log(`Applied ${result.created.measurementTypes} measurement type, ${result.created.materials} material, and ${result.created.colors} color EN translations atomically.`)
}

async function main() {
    const options = parseCliOptions()
    if (options.showHelp) {
        printHelp()
        return
    }

    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: getConnectionString() }),
        log: ["error"],
    })

    try {
        if (options.mode === "plan") {
            await loadTranslationCandidates(prisma, options)
        } else if (options.mode === "generate") {
            await generateDraft(prisma, options)
        } else {
            await applyDraft(prisma, options.applyPath)
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown variant dictionary translation error"
    console.error(message)
    process.exitCode = 1
})
