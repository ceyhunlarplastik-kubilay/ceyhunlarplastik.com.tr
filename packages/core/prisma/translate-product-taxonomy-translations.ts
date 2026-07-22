import "dotenv/config"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"

import {
    ProductTaxonomyTranslationDraftError,
    applyProductTaxonomyTranslationDraft,
    buildProductTaxonomyTranslationWrites,
    createProductTaxonomyTranslationDraft,
    parseProductTaxonomyTranslationDraft,
    type ProductTaxonomyTranslationDraftStore,
} from "../src/core/helpers/productAttributes/productTaxonomyTranslationDraft"
import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { PrismaClient } from "./generated/prisma/client"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEFAULT_DRAFT_PATH = ".translation-drafts/product-taxonomy-tr-en.json"
const PRODUCT_TAXONOMY_TRANSLATION_CONTEXT = [
    "Bu metinler endüstriyel plastik ürünleri için kısa ürün filtresi, teknik",
    "özellik ve taksonomi değerleridir. Teknik terimleri koruyarak kısa ve",
    "doğal bir e-ticaret filtre etiketi olarak çevirin.",
].join(" ")

type CliMode = "plan" | "generate" | "apply"
type EntityFilter = "all" | "attributes" | "values"

type CliOptions = {
    mode: CliMode
    entity: EntityFilter
    applyPath?: string
    outputPath: string
    limit?: number
    attributeCode?: string
    showHelp: boolean
}

type TranslationCandidate =
    | {
        entity: "productAttribute"
        productAttributeId: string
        productAttributeCode: string
        sourceName: string
    }
    | {
        entity: "productAttributeValue"
        productAttributeValueId: string
        attributeId: string
        attributeCode: string
        sourceName: string
    }

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
            "attribute-code": { type: "string" },
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
    const attributeCode = values["attribute-code"]?.trim() || undefined

    if (mode === "apply" && (limit || attributeCode || values.entity)) {
        throw new Error("--limit, --entity, and --attribute-code cannot be used with --apply")
    }

    return {
        mode,
        entity: parseEntityFilter(values.entity),
        applyPath: values.apply,
        outputPath: values.output ?? DEFAULT_DRAFT_PATH,
        limit,
        attributeCode,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log([
        "Generate and apply reviewed English ProductAttribute/ProductAttributeValue translation drafts with DeepL.",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:product-taxonomy-translations",
        "  npm --workspace packages/core run translate:product-taxonomy-translations -- --plan",
        "  npm --workspace packages/core run translate:product-taxonomy-translations -- --generate",
        "  npm --workspace packages/core run translate:product-taxonomy-translations -- --apply .translation-drafts/product-taxonomy-tr-en.json",
        "",
        "Options:",
        "  --plan                 Show candidates without calling DeepL or writing the database (default)",
        "  --generate             Call DeepL and create a review draft without writing the database",
        "  --apply <path>          Validate and atomically apply a reviewed draft without calling DeepL",
        "  --output <path>         Draft output path (default: .translation-drafts/product-taxonomy-tr-en.json)",
        "  --entity <name>         all, attributes, or values (default: all)",
        "  --limit <number>        Limit rows during plan/generate",
        "  --attribute-code <code> Restrict values during plan/generate",
        "  -h, --help              Show this help",
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

async function loadAttributeCandidates(
    prisma: PrismaClient,
    options: Pick<CliOptions, "limit">,
) {
    const attributes = await prisma.productAttribute.findMany({
        select: {
            id: true,
            code: true,
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: {
                    locale: true,
                    name: true,
                },
            },
        },
        orderBy: { displayOrder: "asc" },
        take: options.limit,
    })
    const missingSource = attributes.filter((attribute) =>
        !attribute.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = attributes.filter((attribute) =>
        attribute.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = attributes.flatMap<TranslationCandidate>((attribute) => {
        const source = attribute.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = attribute.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                entity: "productAttribute",
                productAttributeId: attribute.id,
                productAttributeCode: attribute.code,
                sourceName: source.name,
            }]
            : []
    })

    return {
        candidates,
        missingSource,
        existingTarget,
        total: attributes.length,
    }
}

async function loadValueCandidates(
    prisma: PrismaClient,
    options: Pick<CliOptions, "limit" | "attributeCode">,
) {
    const values = await prisma.productAttributeValue.findMany({
        where: options.attributeCode ? { attribute: { code: options.attributeCode } } : undefined,
        select: {
            id: true,
            attributeId: true,
            attribute: {
                select: {
                    code: true,
                },
            },
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: {
                    locale: true,
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: [
            { attribute: { displayOrder: "asc" } },
            { displayOrder: "asc" },
        ],
        take: options.limit,
    })
    const missingSource = values.filter((value) =>
        !value.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = values.filter((value) =>
        value.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = values.flatMap<TranslationCandidate>((value) => {
        const source = value.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = value.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                entity: "productAttributeValue",
                productAttributeValueId: value.id,
                attributeId: value.attributeId,
                attributeCode: value.attribute.code,
                sourceName: source.name,
            }]
            : []
    })

    return {
        candidates,
        missingSource,
        existingTarget,
        total: values.length,
    }
}

async function loadTranslationCandidates(prisma: PrismaClient, options: CliOptions) {
    const [attributeResult, valueResult] = await Promise.all([
        options.entity === "all" || options.entity === "attributes"
            ? loadAttributeCandidates(prisma, options)
            : Promise.resolve({ candidates: [], missingSource: [], existingTarget: [], total: 0 }),
        options.entity === "all" || options.entity === "values"
            ? loadValueCandidates(prisma, options)
            : Promise.resolve({ candidates: [], missingSource: [], existingTarget: [], total: 0 }),
    ])
    const candidates = [...attributeResult.candidates, ...valueResult.candidates]
    const estimatedCharacters = estimateTranslationCharacters(
        candidates.map(({ sourceName }) => sourceName),
    )

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        entity: options.entity,
        attributes: attributeResult.total,
        values: valueResult.total,
        missingSourceAttributes: attributeResult.missingSource.length,
        missingSourceValues: valueResult.missingSource.length,
        existingTargetAttributes: attributeResult.existingTarget.length,
        existingTargetValues: valueResult.existingTarget.length,
        candidates: candidates.length,
        estimatedCharacters,
    }, null, 2))

    if (candidates.length > 0) {
        console.table(candidates.map((candidate) => ({
            entity: candidate.entity,
            code: candidate.entity === "productAttribute"
                ? candidate.productAttributeCode
                : candidate.attributeCode,
            sourceName: candidate.sourceName,
        })))
    }

    const missingSourceCount = attributeResult.missingSource.length + valueResult.missingSource.length
    if (missingSourceCount > 0) {
        console.table([
            ...attributeResult.missingSource.map(({ code }) => ({
                entity: "ProductAttribute",
                code,
            })),
            ...valueResult.missingSource.map(({ attribute, id }) => ({
                entity: "ProductAttributeValue",
                code: attribute.code,
                id,
            })),
        ])
        throw new Error(
            `${missingSourceCount} taxonomy rows have no TR translation; run and verify the TR backfill first`,
        )
    }

    return { candidates, estimatedCharacters }
}

async function generateDraft(prisma: PrismaClient, options: CliOptions) {
    const { candidates, estimatedCharacters } = await loadTranslationCandidates(prisma, options)

    if (candidates.length === 0) {
        console.log("No taxonomy rows require an EN translation; DeepL was not called.")
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
        context: PRODUCT_TAXONOMY_TRANSLATION_CONTEXT,
    })
    const billedCharacters = translations.reduce(
        (total, translation) => total + translation.billedCharacters,
        0,
    )
    const draft = createProductTaxonomyTranslationDraft({
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
        code: entry.entity === "productAttribute"
            ? entry.productAttributeCode
            : entry.attributeCode,
        sourceName: entry.source.name,
        targetName: entry.target.name,
        targetSlug: entry.entity === "productAttributeValue" ? entry.target.slug : "",
    })))
    console.log(`Review draft created: ${outputPath}`)
    console.log("No database records were written.")
}

function createDraftStore(prisma: PrismaClient): ProductTaxonomyTranslationDraftStore {
    const loadAttributes = (attributeIds: string[]) => attributeIds.length === 0
        ? Promise.resolve([])
        : prisma.productAttribute.findMany({
            where: { id: { in: attributeIds } },
            select: {
                id: true,
                code: true,
                translations: {
                    where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                    select: {
                        locale: true,
                        name: true,
                    },
                },
            },
        })
    const loadValues = (valueIds: string[]) => valueIds.length === 0
        ? Promise.resolve([])
        : prisma.productAttributeValue.findMany({
            where: { id: { in: valueIds } },
            select: {
                id: true,
                attributeId: true,
                attribute: {
                    select: {
                        code: true,
                    },
                },
                translations: {
                    where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                    select: {
                        locale: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        })

    return {
        loadAttributes,
        loadValues,
        findValueSlugOwners: async (locale, slugs) => {
            if (slugs.length === 0) return []

            return prisma.productAttributeValueTranslation.findMany({
                where: {
                    locale,
                    OR: slugs.map(({ attributeId, slug }) => ({
                        attributeId,
                        slug,
                    })),
                },
                select: {
                    productAttributeValueId: true,
                    attributeId: true,
                    slug: true,
                },
            })
        },
        createManyAtomically: (writes, draft) => prisma.$transaction(async (transaction) => {
            const store = createDraftStore(transaction as unknown as PrismaClient)
            const [currentAttributes, currentValues] = await Promise.all([
                store.loadAttributes(draft.entries
                    .filter((entry) => entry.entity === "productAttribute")
                    .map((entry) => entry.productAttributeId)),
                store.loadValues(draft.entries
                    .filter((entry) => entry.entity === "productAttributeValue")
                    .map((entry) => entry.productAttributeValueId)),
            ])
            const currentWrites = buildProductTaxonomyTranslationWrites({
                draft,
                attributes: currentAttributes,
                values: currentValues,
            })

            if (JSON.stringify(currentWrites) !== JSON.stringify(writes)) {
                throw new ProductTaxonomyTranslationDraftError(
                    "Product taxonomy translation writes changed during atomic validation",
                )
            }

            const conflictingSlugs = currentWrites.values.length === 0
                ? []
                : await transaction.productAttributeValueTranslation.findMany({
                    where: {
                        locale: draft.targetLocale,
                        OR: currentWrites.values.map(({ attributeId, slug }) => ({
                            attributeId,
                            slug,
                        })),
                    },
                    select: {
                        productAttributeValueId: true,
                        attributeId: true,
                        slug: true,
                    },
                })

            if (conflictingSlugs.length > 0) {
                throw new ProductTaxonomyTranslationDraftError(conflictingSlugs
                    .map(({ productAttributeValueId, attributeId, slug }) =>
                        `Target slug "${slug}" is already used by value ${productAttributeValueId} for attribute ${attributeId}`,
                    )
                    .join("\n"))
            }

            const attributeResult = currentWrites.attributes.length === 0
                ? { count: 0 }
                : await transaction.productAttributeTranslation.createMany({
                    data: currentWrites.attributes,
                })
            const valueResult = currentWrites.values.length === 0
                ? { count: 0 }
                : await transaction.productAttributeValueTranslation.createMany({
                    data: currentWrites.values,
                })

            return {
                attributes: attributeResult.count,
                values: valueResult.count,
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
        throw new ProductTaxonomyTranslationDraftError(`Draft is not valid JSON: ${absolutePath}`)
    }

    const draft = parseProductTaxonomyTranslationDraft(input)
    console.log(JSON.stringify({
        draft: absolutePath,
        generatedAt: draft.generatedAt,
        sourceLocale: draft.sourceLocale,
        targetLocale: draft.targetLocale,
        glossaryId: draft.glossaryId,
        entries: draft.entries.length,
    }, null, 2))

    const result = await applyProductTaxonomyTranslationDraft({
        draft,
        store: createDraftStore(prisma),
    })

    console.table([
        ...result.writes.attributes.map((write) => ({
            entity: "ProductAttribute",
            id: write.productAttributeId,
            name: write.name,
            slug: "",
        })),
        ...result.writes.values.map((write) => ({
            entity: "ProductAttributeValue",
            id: write.productAttributeValueId,
            name: write.name,
            slug: write.slug,
        })),
    ])
    console.log(`Applied ${result.created.attributes} attribute and ${result.created.values} value EN translations atomically.`)
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
    const message = error instanceof Error ? error.message : "Unknown product taxonomy translation error"
    console.error(message)
    process.exitCode = 1
})
