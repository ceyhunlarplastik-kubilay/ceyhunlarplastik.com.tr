import "dotenv/config"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"

import {
    ProductIndustrialUsageTranslationDraftError,
    applyProductIndustrialUsageTranslationDraft,
    createProductIndustrialUsageTranslationDraft,
    parseProductIndustrialUsageTranslationDraft,
    type ProductIndustrialUsageTranslationDraftStore,
} from "../src/core/helpers/products/productIndustrialUsageTranslationDraft"
import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { PrismaClient } from "./generated/prisma/client"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEFAULT_DRAFT_PATH = ".translation-drafts/product-industrial-usages-tr-en.json"
const CONTEXT = [
    "Bu metinler endüstriyel plastik ürün detay sayfalarında kullanım alanı",
    "açıklaması olarak gösterilir. Teknik anlamı koruyarak doğal ve profesyonel",
    "İngilizce ürün açıklaması şeklinde çevirin.",
].join(" ")

type CliMode = "plan" | "generate" | "apply"

type CliOptions = {
    mode: CliMode
    applyPath?: string
    outputPath: string
    limit?: number
    productId?: string
    productCode?: string
    showHelp: boolean
}

type TranslationCandidate = {
    productIndustrialUsageId: string
    productId: string
    productCode: string
    sourceUsageFunction: string
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
            limit: { type: "string" },
            "product-id": { type: "string" },
            "product-code": { type: "string" },
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
    const productId = values["product-id"]?.trim() || undefined
    const productCode = values["product-code"]?.trim() || undefined

    if (mode === "apply" && (limit || productId || productCode)) {
        throw new Error("--limit, --product-id, and --product-code cannot be used with --apply")
    }

    return {
        mode,
        applyPath: values.apply,
        outputPath: values.output ?? DEFAULT_DRAFT_PATH,
        limit,
        productId,
        productCode,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log([
        "Generate and apply reviewed English ProductIndustrialUsage usageFunction drafts with DeepL.",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:product-industrial-usage-translations",
        "  npm --workspace packages/core run translate:product-industrial-usage-translations -- --plan",
        "  npm --workspace packages/core run translate:product-industrial-usage-translations -- --generate",
        "  npm --workspace packages/core run translate:product-industrial-usage-translations -- --apply .translation-drafts/product-industrial-usages-tr-en.json",
        "",
        "Options:",
        "  --plan                 Show candidates without calling DeepL or writing the database (default)",
        "  --generate             Call DeepL and create a review draft without writing the database",
        "  --apply <path>          Validate and atomically apply a reviewed draft without calling DeepL",
        "  --output <path>         Draft output path (default: .translation-drafts/product-industrial-usages-tr-en.json)",
        "  --limit <number>        Limit rows during plan/generate",
        "  --product-id <id>       Restrict rows during plan/generate",
        "  --product-code <code>   Restrict rows during plan/generate",
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

async function loadTranslationCandidates(prisma: PrismaClient, options: CliOptions) {
    const usages = await prisma.productIndustrialUsage.findMany({
        where: {
            ...(options.productId && { productId: options.productId }),
            ...(options.productCode && { product: { code: options.productCode } }),
            usageFunction: { not: null },
        },
        select: {
            id: true,
            productId: true,
            usageFunction: true,
            product: {
                select: {
                    code: true,
                },
            },
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: {
                    locale: true,
                    usageFunction: true,
                },
            },
        },
        orderBy: [
            { product: { code: "asc" } },
            { displayOrder: "asc" },
        ],
        take: options.limit,
    })
    const nonEmptyUsages = usages.filter((usage) => usage.usageFunction?.trim())
    const missingSource = nonEmptyUsages.filter((usage) =>
        !usage.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = nonEmptyUsages.filter((usage) =>
        usage.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = nonEmptyUsages.flatMap<TranslationCandidate>((usage) => {
        const source = usage.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = usage.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                productIndustrialUsageId: usage.id,
                productId: usage.productId,
                productCode: usage.product.code,
                sourceUsageFunction: source.usageFunction,
            }]
            : []
    })
    const estimatedCharacters = estimateTranslationCharacters(
        candidates.map(({ sourceUsageFunction }) => sourceUsageFunction),
    )

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        usages: nonEmptyUsages.length,
        ignoredEmpty: usages.length - nonEmptyUsages.length,
        missingSource: missingSource.length,
        existingTarget: existingTarget.length,
        candidates: candidates.length,
        estimatedCharacters,
    }, null, 2))

    if (candidates.length > 0) {
        console.table(candidates.map((candidate) => ({
            productCode: candidate.productCode,
            id: candidate.productIndustrialUsageId,
            sourceUsageFunction: candidate.sourceUsageFunction,
        })))
    }

    if (missingSource.length > 0) {
        console.table(missingSource.map((usage) => ({
            entity: "ProductIndustrialUsage",
            productCode: usage.product.code,
            id: usage.id,
        })))
        throw new Error(
            `${missingSource.length} product industrial usage rows have no TR translation; run and verify the TR backfill first`,
        )
    }

    return { candidates, estimatedCharacters }
}

async function generateDraft(prisma: PrismaClient, options: CliOptions) {
    const { candidates, estimatedCharacters } = await loadTranslationCandidates(prisma, options)

    if (candidates.length === 0) {
        console.log("No product industrial usage rows require an EN translation; DeepL was not called.")
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
        texts: candidates.map(({ sourceUsageFunction }) => sourceUsageFunction),
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        context: CONTEXT,
    })
    const billedCharacters = translations.reduce(
        (total, translation) => total + translation.billedCharacters,
        0,
    )
    const draft = createProductIndustrialUsageTranslationDraft({
        candidates,
        translatedUsageFunctions: translations.map(({ text }) => text),
        glossaryId,
        estimatedCharacters,
        billedCharacters,
    })
    const outputPath = path.resolve(options.outputPath)

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8")
    console.log(`Wrote ${draft.entries.length} product industrial usage translations to ${outputPath}`)
}

async function applyDraft(prisma: PrismaClient, applyPath: string | undefined) {
    if (!applyPath) throw new Error("--apply requires a draft path")

    const rawDraft = JSON.parse(await readFile(path.resolve(applyPath), "utf8"))
    const draft = parseProductIndustrialUsageTranslationDraft(rawDraft)
    const store: ProductIndustrialUsageTranslationDraftStore = {
        loadUsages: (usageIds) =>
            prisma.productIndustrialUsage.findMany({
                where: { id: { in: usageIds } },
                select: {
                    id: true,
                    productId: true,
                    product: {
                        select: {
                            code: true,
                        },
                    },
                    translations: {
                        where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                        select: {
                            locale: true,
                            usageFunction: true,
                        },
                    },
                },
            }),
        createManyAtomically: async (writes) => {
            const result = await prisma.$transaction(async (tx) => {
                return tx.productIndustrialUsageTranslation.createMany({
                    data: writes,
                })
            })

            return { usages: result.count }
        },
    }
    const result = await applyProductIndustrialUsageTranslationDraft({ draft, store })

    console.log(JSON.stringify({
        created: result.created,
    }, null, 2))
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
    if (error instanceof ProductIndustrialUsageTranslationDraftError) {
        console.error(error.message)
    } else {
        console.error(error)
    }
    process.exitCode = 1
})
