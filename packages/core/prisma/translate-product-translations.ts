import "dotenv/config"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"

import {
    ProductTranslationDraftError,
    applyProductTranslationDraft,
    createProductTranslationDraft,
    parseProductTranslationDraft,
    type ProductTranslationDraftStore,
} from "../src/core/helpers/products/productTranslationDraft"
import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { PrismaClient } from "./generated/prisma/client"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEFAULT_DRAFT_PATH = ".translation-drafts/products-tr-en.json"
const CONTEXT = [
    "Bu metinler endüstriyel plastik ürün detay ve katalog sayfalarında",
    "görünen ürün adı ve açıklamalarıdır. Ürün kodlarını, teknik terimleri",
    "ve ölçü/malzeme ifadelerini koruyarak profesyonel İngilizceye çevirin.",
].join(" ")

type CliMode = "plan" | "generate" | "apply"

type CliOptions = {
    mode: CliMode
    applyPath?: string
    outputPath: string
    limit?: number
    productId?: string
    productCode?: string
    categoryId?: string
    categoryCode?: number
    showHelp: boolean
}

type TranslationCandidate = {
    id: string
    code: string
    sourceName: string
    sourceSlug: string
    sourceDescription: string | null
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
            "category-id": { type: "string" },
            "category-code": { type: "string" },
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
    const categoryCode = parsePositiveInteger(values["category-code"], "--category-code")
    const productId = values["product-id"]?.trim() || undefined
    const productCode = values["product-code"]?.trim() || undefined
    const categoryId = values["category-id"]?.trim() || undefined

    if (mode === "apply" && (limit || productId || productCode || categoryId || categoryCode)) {
        throw new Error("--limit, --product-id, --product-code, --category-id, and --category-code cannot be used with --apply")
    }

    return {
        mode,
        applyPath: values.apply,
        outputPath: values.output ?? DEFAULT_DRAFT_PATH,
        limit,
        productId,
        productCode,
        categoryId,
        categoryCode,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log([
        "Generate and apply reviewed English ProductTranslation drafts with DeepL.",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:product-translations",
        "  npm --workspace packages/core run translate:product-translations -- --plan",
        "  npm --workspace packages/core run translate:product-translations -- --generate",
        "  npm --workspace packages/core run translate:product-translations -- --apply .translation-drafts/products-tr-en.json",
        "",
        "Options:",
        "  --plan                  Show candidates without calling DeepL or writing the database (default)",
        "  --generate              Call DeepL and create a review draft without writing the database",
        "  --apply <path>           Validate and atomically apply a reviewed draft without calling DeepL",
        "  --output <path>          Draft output path (default: .translation-drafts/products-tr-en.json)",
        "  --limit <number>         Limit products during plan/generate",
        "  --product-id <id>        Restrict products during plan/generate",
        "  --product-code <code>    Restrict products during plan/generate",
        "  --category-id <id>       Restrict products during plan/generate",
        "  --category-code <code>   Restrict products during plan/generate",
        "  -h, --help               Show this help",
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
    const products = await prisma.product.findMany({
        where: {
            ...(options.productId && { id: options.productId }),
            ...(options.productCode && { code: options.productCode }),
            ...(options.categoryId && { categoryId: options.categoryId }),
            ...(options.categoryCode && { category: { code: options.categoryCode } }),
        },
        select: {
            id: true,
            code: true,
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                select: {
                    locale: true,
                    name: true,
                    slug: true,
                    description: true,
                },
            },
        },
        orderBy: { code: "asc" },
        take: options.limit,
    })

    if ((options.productId || options.productCode) && products.length === 0) {
        throw new Error("Requested product was not found")
    }

    const missingSource = products.filter((product) =>
        !product.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = products.filter((product) =>
        product.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = products.flatMap<TranslationCandidate>((product) => {
        const source = product.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = product.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                id: product.id,
                code: product.code,
                sourceName: source.name,
                sourceSlug: source.slug,
                sourceDescription: source.description ?? null,
            }]
            : []
    })
    const translationTexts = candidates.flatMap((candidate) => [
        candidate.sourceName,
        ...(candidate.sourceDescription ? [candidate.sourceDescription] : []),
    ])
    const estimatedCharacters = estimateTranslationCharacters(translationTexts)

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        products: products.length,
        missingSource: missingSource.length,
        existingTarget: existingTarget.length,
        candidates: candidates.length,
        estimatedCharacters,
    }, null, 2))

    if (candidates.length > 0) {
        console.table(candidates.map((candidate) => ({
            code: candidate.code,
            sourceName: candidate.sourceName,
            hasDescription: Boolean(candidate.sourceDescription),
        })))
    }

    if (missingSource.length > 0) {
        console.table(missingSource.map((product) => ({
            entity: "Product",
            code: product.code,
            id: product.id,
        })))
        throw new Error(
            `${missingSource.length} products have no TR translation; run and verify the TR backfill first`,
        )
    }

    return { candidates, estimatedCharacters }
}

async function generateDraft(prisma: PrismaClient, options: CliOptions) {
    const { candidates, estimatedCharacters } = await loadTranslationCandidates(prisma, options)

    if (candidates.length === 0) {
        console.log("No products require an EN translation; DeepL was not called.")
        return
    }

    const apiKey = process.env.DEEPL_API_KEY?.trim()
    if (!apiKey) throw new Error("DEEPL_API_KEY is required for --generate")

    const glossaryId = process.env.DEEPL_GLOSSARY_ID?.trim() || undefined
    const translator = new DeepLTranslator({ apiKey, glossaryId })
    const usage = await translator.getUsage()

    assertDeepLQuotaAvailable(usage, estimatedCharacters)
    console.log(JSON.stringify({ deepLUsage: usage }, null, 2))

    const texts = candidates.flatMap((candidate) => [
        candidate.sourceName,
        ...(candidate.sourceDescription ? [candidate.sourceDescription] : []),
    ])
    const translations = await translator.translateTexts({
        texts,
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        context: CONTEXT,
    })
    const billedCharacters = translations.reduce(
        (total, translation) => total + translation.billedCharacters,
        0,
    )
    let translationIndex = 0
    const translatedProducts = candidates.map((candidate) => {
        const name = translations[translationIndex++]?.text
        if (!name) {
            throw new Error(`DeepL did not return a name translation for product ${candidate.code}`)
        }
        const description = candidate.sourceDescription
            ? translations[translationIndex++]?.text ?? null
            : null

        return { name, description }
    })
    const draft = createProductTranslationDraft({
        products: candidates,
        translatedProducts,
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
        code: entry.productCode,
        sourceName: entry.source.name,
        targetName: entry.target.name,
        targetSlug: entry.target.slug,
    })))
    console.log(`Review draft created: ${outputPath}`)
    console.log("No database records were written.")
}

async function applyDraft(prisma: PrismaClient, applyPath: string | undefined) {
    if (!applyPath) throw new Error("--apply requires a draft path")

    const rawDraft = JSON.parse(await readFile(path.resolve(applyPath), "utf8"))
    const draft = parseProductTranslationDraft(rawDraft)
    const store: ProductTranslationDraftStore = {
        loadProducts: (productIds) =>
            prisma.product.findMany({
                where: { id: { in: productIds } },
                select: {
                    id: true,
                    code: true,
                    translations: {
                        where: { locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] } },
                        select: {
                            locale: true,
                            name: true,
                            slug: true,
                            description: true,
                        },
                    },
                },
            }),
        findSlugOwners: async (locale, slugs) => {
            if (slugs.length === 0) return []

            return prisma.productTranslation.findMany({
                where: {
                    locale,
                    slug: { in: slugs },
                },
                select: {
                    productId: true,
                    slug: true,
                },
            })
        },
        createManyAtomically: (writes) => prisma.$transaction(async (transaction) => {
            const result = await transaction.productTranslation.createMany({
                data: writes,
            })

            return result.count
        }),
    }
    const result = await applyProductTranslationDraft({ draft, store })

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
        if (options.mode === "apply") {
            await applyDraft(prisma, options.applyPath)
        } else if (options.mode === "generate") {
            await generateDraft(prisma, options)
        } else {
            await loadTranslationCandidates(prisma, options)
        }
    } catch (error) {
        if (error instanceof ProductTranslationDraftError) {
            console.error(error.message)
            process.exitCode = 1
            return
        }
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
