import "dotenv/config"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"

import { PrismaPg } from "@prisma/adapter-pg"

import {
    CategoryTranslationDraftError,
    applyCategoryTranslationDraft,
    buildCategoryTranslationWrites,
    createCategoryTranslationDraft,
    parseCategoryTranslationDraft,
    type CategoryTranslationDraftStore,
} from "../src/core/helpers/categories/categoryTranslationDraft"
import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { PrismaClient } from "./generated/prisma/client"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEFAULT_DRAFT_PATH = ".translation-drafts/category-tr-en.json"
const CATEGORY_TRANSLATION_CONTEXT = [
    "Bu metinler endüstriyel plastik ürünleri, makine parçaları ve mobilya",
    "aksesuarları için kısa e-ticaret kategori adlarıdır. Teknik terimleri",
    "koruyarak kısa ve doğal bir kategori başlığı olarak çevirin.",
].join(" ")

type CliMode = "plan" | "generate" | "apply"

type CliOptions = {
    mode: CliMode
    applyPath?: string
    outputPath: string
    limit?: number
    categoryCode?: number
    showHelp: boolean
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

    if (mode === "apply" && (limit || categoryCode)) {
        throw new Error("--limit and --category-code cannot be used with --apply")
    }

    return {
        mode,
        applyPath: values.apply,
        outputPath: values.output ?? DEFAULT_DRAFT_PATH,
        limit,
        categoryCode,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log([
        "Generate and apply reviewed English CategoryTranslation drafts with DeepL.",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:category-translations",
        "  npm --workspace packages/core run translate:category-translations -- --plan",
        "  npm --workspace packages/core run translate:category-translations -- --generate",
        "  npm --workspace packages/core run translate:category-translations -- --apply .translation-drafts/category-tr-en.json",
        "",
        "Options:",
        "  --plan                 Show candidates without calling DeepL or writing the database (default)",
        "  --generate             Call DeepL and create a review draft without writing the database",
        "  --apply <path>          Validate and atomically apply a reviewed draft without calling DeepL",
        "  --output <path>         Draft output path (default: .translation-drafts/category-tr-en.json)",
        "  --limit <number>        Limit categories during plan/generate",
        "  --category-code <code> Select one category during plan/generate",
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

async function loadTranslationCandidates(
    prisma: PrismaClient,
    options: Pick<CliOptions, "limit" | "categoryCode">,
) {
    const categories = await prisma.category.findMany({
        where: options.categoryCode ? { code: options.categoryCode } : undefined,
        select: {
            id: true,
            code: true,
            translations: {
                where: {
                    locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] },
                },
                select: {
                    locale: true,
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: { code: "asc" },
        take: options.limit,
    })

    if (options.categoryCode && categories.length === 0) {
        throw new Error(`Category code ${options.categoryCode} was not found`)
    }

    const missingSource = categories.filter((category) =>
        !category.translations.some(({ locale }) => locale === SOURCE_LOCALE),
    )
    const existingTarget = categories.filter((category) =>
        category.translations.some(({ locale }) => locale === TARGET_LOCALE),
    )
    const candidates = categories.flatMap((category) => {
        const source = category.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = category.translations.find(({ locale }) => locale === TARGET_LOCALE)

        return source && !target
            ? [{
                id: category.id,
                code: category.code,
                sourceName: source.name,
            }]
            : []
    })
    const estimatedCharacters = estimateTranslationCharacters(
        candidates.map(({ sourceName }) => sourceName),
    )

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        categories: categories.length,
        missingSource: missingSource.length,
        existingTarget: existingTarget.length,
        candidates: candidates.length,
        estimatedCharacters,
    }, null, 2))

    if (candidates.length > 0) {
        console.table(candidates.map(({ code, sourceName }) => ({ code, sourceName })))
    }

    if (missingSource.length > 0) {
        console.table(missingSource.map(({ code }) => ({ code })))
        throw new Error(
            `${missingSource.length} categories have no TR translation; run and verify the TR backfill first`,
        )
    }

    return { candidates, estimatedCharacters }
}

async function generateDraft(prisma: PrismaClient, options: CliOptions) {
    const { candidates, estimatedCharacters } = await loadTranslationCandidates(prisma, options)

    if (candidates.length === 0) {
        console.log("No categories require an EN translation; DeepL was not called.")
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
        context: CATEGORY_TRANSLATION_CONTEXT,
    })
    const billedCharacters = translations.reduce(
        (total, translation) => total + translation.billedCharacters,
        0,
    )
    const draft = createCategoryTranslationDraft({
        categories: candidates,
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
        code: entry.categoryCode,
        sourceName: entry.source.name,
        targetName: entry.target.name,
        targetSlug: entry.target.slug,
    })))
    console.log(`Review draft created: ${outputPath}`)
    console.log("No database records were written.")
}

function createDraftStore(prisma: PrismaClient): CategoryTranslationDraftStore {
    return {
        loadCategories: (categoryIds) => prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: {
                id: true,
                code: true,
                translations: {
                    where: {
                        locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] },
                    },
                    select: {
                        locale: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        }),
        findSlugOwners: async (locale, slugs) => {
            if (slugs.length === 0) return []

            return prisma.categoryTranslation.findMany({
                where: {
                    locale,
                    slug: { in: slugs },
                },
                select: {
                    categoryId: true,
                    slug: true,
                },
            })
        },
        createManyAtomically: (writes, draft) => prisma.$transaction(async (transaction) => {
            const currentCategories = await transaction.category.findMany({
                where: {
                    id: { in: draft.entries.map(({ categoryId }) => categoryId) },
                },
                select: {
                    id: true,
                    code: true,
                    translations: {
                        where: {
                            locale: { in: [SOURCE_LOCALE, TARGET_LOCALE] },
                        },
                        select: {
                            locale: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            })
            const currentWrites = buildCategoryTranslationWrites(draft, currentCategories)

            if (JSON.stringify(currentWrites) !== JSON.stringify(writes)) {
                throw new CategoryTranslationDraftError(
                    "Category translation writes changed during atomic validation",
                )
            }

            const conflictingSlugs = await transaction.categoryTranslation.findMany({
                where: {
                    locale: draft.targetLocale,
                    slug: { in: currentWrites.map(({ slug }) => slug) },
                },
                select: {
                    categoryId: true,
                    slug: true,
                },
            })

            if (conflictingSlugs.length > 0) {
                throw new CategoryTranslationDraftError(conflictingSlugs
                    .map(({ categoryId, slug }) =>
                        `Target slug "${slug}" is already used by category ${categoryId}`,
                    )
                    .join("\n"))
            }

            const result = await transaction.categoryTranslation.createMany({
                data: currentWrites,
            })

            if (result.count !== currentWrites.length) {
                throw new CategoryTranslationDraftError(
                    `Expected to create ${currentWrites.length} translations, created ${result.count}`,
                )
            }

            const persisted = await transaction.categoryTranslation.count({
                where: {
                    OR: currentWrites.map((write) => ({
                        categoryId: write.categoryId,
                        locale: write.locale,
                        name: write.name,
                        slug: write.slug,
                    })),
                },
            })

            if (persisted !== currentWrites.length) {
                throw new CategoryTranslationDraftError(
                    `Atomic verification failed: expected ${currentWrites.length} translations, found ${persisted}`,
                )
            }

            return result.count
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
        throw new CategoryTranslationDraftError(`Draft is not valid JSON: ${absolutePath}`)
    }

    const draft = parseCategoryTranslationDraft(input)
    console.log(JSON.stringify({
        draft: absolutePath,
        generatedAt: draft.generatedAt,
        sourceLocale: draft.sourceLocale,
        targetLocale: draft.targetLocale,
        glossaryId: draft.glossaryId,
        entries: draft.entries.length,
    }, null, 2))

    const result = await applyCategoryTranslationDraft({
        draft,
        store: createDraftStore(prisma),
    })

    console.table(result.writes.map((write) => ({
        categoryId: write.categoryId,
        name: write.name,
        slug: write.slug,
    })))
    console.log(`Applied ${result.created} EN category translations atomically.`)
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
    const message = error instanceof Error ? error.message : "Unknown category translation error"
    console.error(message)
    process.exitCode = 1
})
