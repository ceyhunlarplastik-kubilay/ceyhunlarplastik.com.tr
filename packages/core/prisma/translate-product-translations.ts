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
    checkSourceRoundTrip,
    composeProductName,
    resolveTemplate,
    serializeTemplate,
    type ProductNameParts,
} from "../src/core/helpers/products/productNameFormula"
import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { TARGET_LOCALES, type TargetLocale } from "../src/core/i18n/locales"
import {
    TRANSLATION_DRAFT_SOURCE_LOCALE,
    buildTranslationDraftPath,
    parseTargetLocaleOption,
} from "../src/core/i18n/translationDraft"
import { PrismaClient } from "./generated/prisma/client"

const SOURCE_LOCALE = TRANSLATION_DRAFT_SOURCE_LOCALE
const DRAFT_ENTITY = "products"
const CONTEXT = [
    "Bu metinler endüstriyel plastik ürün detay ve katalog sayfalarında",
    "görünen ürün açıklamalarıdır. Ürün kodlarını, teknik terimleri",
    "ve ölçü/malzeme ifadelerini koruyarak profesyonel biçimde çevirin.",
].join(" ")

type CliMode = "plan" | "generate" | "apply"

/** Tek bir dil için çözülmüş seçenekler — plan/generate bunun üzerinden çalışır. */
type LocaleRun = {
    targetLocale: TargetLocale
    outputPath: string
}

type CliOptions = {
    mode: CliMode
    /** `--target-locale all` verildiğinde 13 hedef dilin tamamı. */
    localeRuns: LocaleRun[]
    applyPaths: string[]
    limit?: number
    productId?: string
    productCode?: string
    categoryId?: string
    categoryCode?: number
    excludeCategoryCodes: number[]
    showHelp: boolean
}

/** Bir çalıştırmanın tek dile ait kısmı. */
type RunOptions = Omit<CliOptions, "localeRuns" | "applyPaths"> & LocaleRun

type TranslationCandidate = {
    id: string
    code: string
    sourceName: string
    sourceSlug: string
    sourceDescription: string | null
    /**
     * Formülle bestelenmiş hedef-dil adı. `null` ise formül uygulanamadı
     * (attribute atanmamış veya şablon çıkarılamadı) → ad DeepL'e düşer.
     */
    composedName: string | null
    composeNote: string | null
    /** Kaynak dilde geri-beste saklı addan farklıysa doldurulur (veri kalitesi). */
    sourceRoundTrip: string | null
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
            apply: { type: "string", multiple: true },
            "target-locale": { type: "string" },
            output: { type: "string" },
            limit: { type: "string" },
            "product-id": { type: "string" },
            "product-code": { type: "string" },
            "category-id": { type: "string" },
            "category-code": { type: "string" },
            "exclude-category-code": { type: "string", multiple: true },
            help: { type: "boolean", short: "h" },
        },
    })

    const applyPaths = (values.apply ?? []).map((path) => path.trim()).filter(Boolean)
    const selectedModes: CliMode[] = []
    if (values.plan) selectedModes.push("plan")
    if (values.generate) selectedModes.push("generate")
    if (applyPaths.length > 0) selectedModes.push("apply")

    if (selectedModes.length > 1) {
        throw new Error("Use only one of --plan, --generate, or --apply")
    }

    const mode = selectedModes[0] ?? "plan"
    const limit = parsePositiveInteger(values.limit, "--limit")
    const categoryCode = parsePositiveInteger(values["category-code"], "--category-code")
    const productId = values["product-id"]?.trim() || undefined
    const productCode = values["product-code"]?.trim() || undefined
    const categoryId = values["category-id"]?.trim() || undefined
    // Hem tekrarlanabilir (--exclude-category-code 14 --exclude-category-code 30)
    // hem virgüllü (--exclude-category-code 14,30) yazım kabul edilir.
    const excludeCategoryCodes = [...new Set(
        (values["exclude-category-code"] ?? [])
            .flatMap((value) => value.split(","))
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => parsePositiveInteger(value, "--exclude-category-code")!),
    )]

    if (mode === "apply" && (limit || productId || productCode || categoryId || categoryCode || excludeCategoryCodes.length > 0)) {
        throw new Error("Selection flags (--limit, --product-id, --product-code, --category-id, --category-code, --exclude-category-code) cannot be used with --apply")
    }

    if (categoryCode && excludeCategoryCodes.includes(categoryCode)) {
        throw new Error(`--category-code ${categoryCode} is also excluded via --exclude-category-code`)
    }

    const targetLocales = parseTargetLocales(values["target-locale"])
    const output = values.output?.trim() || undefined

    // `all` + sabit --output tek dosyaya 13 dili yazmaya çalışırdı. `{locale}`
    // yer tutucusu verilirse dile göre açılır; verilmezse varsayılan yola düşer.
    if (targetLocales.length > 1 && output && !output.includes("{locale}")) {
        throw new Error(
            "--target-locale all writes one draft per locale; include {locale} in --output"
            + " (e.g. .translation-drafts/products-tr-{locale}-bakalit.json) or omit --output",
        )
    }

    return {
        mode,
        localeRuns: targetLocales.map((targetLocale) => ({
            targetLocale,
            outputPath: output
                ? output.replaceAll("{locale}", targetLocale)
                : buildTranslationDraftPath(DRAFT_ENTITY, targetLocale),
        })),
        applyPaths,
        limit,
        productId,
        productCode,
        categoryId,
        categoryCode,
        excludeCategoryCodes,
        showHelp: values.help ?? false,
    }
}

/** `--target-locale all` → bütün hedef diller; aksi halde tek dil. */
function parseTargetLocales(value: string | undefined): TargetLocale[] {
    return value?.trim().toLowerCase() === "all"
        ? [...TARGET_LOCALES]
        : [parseTargetLocaleOption(value)]
}

function printHelp() {
    console.log([
        "Generate and apply reviewed ProductTranslation drafts (any target locale).",
        "",
        "Product NAMES are composed from the formula, not translated:",
        "  {number} {series word} {attribute values in category order} {category name}",
        "  e.g. '11 Serisi Burç Bağlantılı Elcik Tipi Bakalit Tutamaklar'",
        "    -> '11 Series Bushed Connector Knob Handles Bakelite Handles'",
        "  The slot order per category comes from the table in",
        "  src/core/helpers/products/productNameFormula.ts. DeepL is called only for",
        "  descriptions and for the few names the formula cannot build (missing",
        "  attribute values, or a category with no template).",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:product-translations",
        "  npm --workspace packages/core run translate:product-translations -- --plan",
        "  npm --workspace packages/core run translate:product-translations -- --generate",
        "  npm --workspace packages/core run translate:product-translations -- --apply .translation-drafts/products-tr-en.json",
        "",
        "  # every target locale in one run, skipping categories 14 and 30",
        "  ... -- --plan --target-locale all --exclude-category-code 14,30",
        "  ... -- --generate --target-locale all --exclude-category-code 14,30",
        "  ... -- --apply .translation-drafts/products-tr-en.json --apply .translation-drafts/products-tr-de.json",
        "",
        "Options:",
        "  --plan                   Show candidates without calling DeepL or writing the database (default)",
        "  --generate               Call DeepL and create a review draft without writing the database",
        "  --apply <path>           Validate and atomically apply a reviewed draft; repeatable",
        "  --target-locale <code>   Target locale (default: en), or 'all' for every target locale",
        "  --output <path>          Draft output path (default: .translation-drafts/<entity>-tr-<locale>.json)",
        "                           With --target-locale all, include {locale} in the path",
        "  --limit <number>         Limit products during plan/generate",
        "  --product-id <id>        Restrict products during plan/generate",
        "  --product-code <code>    Restrict products during plan/generate",
        "  --category-id <id>       Restrict products during plan/generate",
        "  --category-code <code>   Restrict products during plan/generate",
        "  --exclude-category-code <codes>  Skip these category codes; repeatable or comma-separated",
        "  -h, --help               Show this help",
        "",
        "Environment:",
        "  DIRECT_URL or DATABASE_URL is required for all data modes.",
        "  DEEPL_API_KEY is required only for --generate.",
        "  DEEPL_GLOSSARY_ID is optional for --generate.",
        "",
        "Existing target-locale translations are never overwritten.",
    ].join("\n"))
}

function getConnectionString() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error("DIRECT_URL or DATABASE_URL is required")
    }
    return connectionString
}

/** İstenen dildeki adı seç; yoksa taban (Türkçe) ada düş. */
function pickName(
    locale: string,
    baseName: string,
    translations: { locale: string; name: string }[],
) {
    return translations.find((translation) => translation.locale === locale)?.name ?? baseName
}

const productFormulaSelect = {
    category: {
        select: {
            code: true,
            name: true,
            translations: { select: { locale: true, name: true } },
        },
    },
    attributeValues: {
        select: {
            name: true,
            attribute: { select: { code: true } },
            translations: { select: { locale: true, name: true } },
        },
    },
} as const

type ProductFormulaRow = {
    category: {
        code: number
        name: string
        translations: { locale: string; name: string }[]
    }
    attributeValues: {
        name: string
        attribute: { code: string }
        translations: { locale: string; name: string }[]
    }[]
}

function buildParts(row: ProductFormulaRow, locale: string): ProductNameParts {
    const attributeValues: Record<string, string | undefined> = {}
    for (const value of row.attributeValues) {
        attributeValues[value.attribute.code] = pickName(locale, value.name, value.translations)
    }

    return {
        attributeValues,
        categoryName: pickName(locale, row.category.name, row.category.translations),
    }
}

async function loadTranslationCandidates(prisma: PrismaClient, options: RunOptions) {
    const products = await prisma.product.findMany({
        where: {
            ...(options.productId && { id: options.productId }),
            ...(options.productCode && { code: options.productCode }),
            ...(options.categoryId && { categoryId: options.categoryId }),
            // --category-code tek kategoriye kilitler; o durumda hariç-tutma zaten
            // anlamsız (çakışma parseCliOptions'ta reddedilir).
            ...(options.categoryCode
                ? { category: { code: options.categoryCode } }
                : options.excludeCategoryCodes.length > 0
                    ? { category: { code: { notIn: options.excludeCategoryCodes } } }
                    : {}),
        },
        select: {
            id: true,
            code: true,
            translations: {
                where: { locale: { in: [SOURCE_LOCALE, options.targetLocale] } },
                select: {
                    locale: true,
                    name: true,
                    slug: true,
                    description: true,
                },
            },
            ...productFormulaSelect,
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
        product.translations.some(({ locale }) => locale === options.targetLocale),
    )
    const candidates = products.flatMap<TranslationCandidate>((product) => {
        const source = product.translations.find(({ locale }) => locale === SOURCE_LOCALE)
        const target = product.translations.find(({ locale }) => locale === options.targetLocale)
        if (!source || target) return []

        const sourceParts = buildParts(product, SOURCE_LOCALE)
        const template = resolveTemplate(product.category.code)

        let composedName: string | null = null
        let composeNote: string | null = null
        let sourceRoundTrip: string | null = null

        if (!template) {
            composeNote = `kategori ${product.category.code} için formül tanımlı değil`
        } else {
            const composed = composeProductName({
                template,
                sourceName: source.name,
                locale: options.targetLocale,
                parts: buildParts(product, options.targetLocale),
            })

            if (composed.ok) {
                composedName = composed.name
                composeNote = serializeTemplate(template)
            } else {
                composeNote = composed.missing
                    ? `eksik: ${composed.missing.join(", ")}`
                    : composed.reason
            }

            const roundTrip = checkSourceRoundTrip({
                template,
                sourceName: source.name,
                parts: sourceParts,
            })
            if (!roundTrip.matches && roundTrip.composed) sourceRoundTrip = roundTrip.composed
        }

        return [{
            id: product.id,
            code: product.code,
            sourceName: source.name,
            sourceSlug: source.slug,
            sourceDescription: source.description ?? null,
            composedName,
            composeNote,
            sourceRoundTrip,
        }]
    })
    // Ad artık formülle besteleniyor → DeepL'e YALNIZ açıklamalar ve formülün
    // uygulanamadığı adlar gider. Kota tahmini de buna göre yapılır.
    const translationTexts = candidates.flatMap((candidate) => [
        ...(candidate.composedName ? [] : [candidate.sourceName]),
        ...(candidate.sourceDescription ? [candidate.sourceDescription] : []),
    ])
    const estimatedCharacters = estimateTranslationCharacters(translationTexts)
    const composed = candidates.filter((candidate) => candidate.composedName)
    const roundTripMismatches = candidates.filter((candidate) => candidate.sourceRoundTrip)

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: options.targetLocale,
        products: products.length,
        missingSource: missingSource.length,
        existingTarget: existingTarget.length,
        candidates: candidates.length,
        composedNames: composed.length,
        deepLNames: candidates.length - composed.length,
        estimatedCharacters,
    }, null, 2))

    if (candidates.length > 0) {
        console.table(candidates.map((candidate) => ({
            code: candidate.code,
            sourceName: candidate.sourceName,
            composedName: candidate.composedName ?? `— (${candidate.composeNote})`,
            hasDescription: Boolean(candidate.sourceDescription),
        })))
    }

    if (roundTripMismatches.length > 0) {
        console.log(
            `\n⚠️  ${roundTripMismatches.length} üründe Türkçe ad, kendi özellik değerlerinden`
            + ` bestelenen adla uyuşmuyor. Çeviri ETKİLENMEZ (doğru olan özellik değerleridir),`
            + ` ama ürün adları düzeltilmeye aday:`,
        )
        console.table(roundTripMismatches.map((candidate) => ({
            code: candidate.code,
            storedName: candidate.sourceName,
            composedFromAttributes: candidate.sourceRoundTrip,
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

async function generateDraft(prisma: PrismaClient, options: RunOptions) {
    const { candidates, estimatedCharacters } = await loadTranslationCandidates(prisma, options)

    if (candidates.length === 0) {
        console.log("No products require an EN translation; DeepL was not called.")
        return
    }

    // Yalnız formülün uygulanamadığı adlar + açıklamalar DeepL'e gider.
    const texts = candidates.flatMap((candidate) => [
        ...(candidate.composedName ? [] : [candidate.sourceName]),
        ...(candidate.sourceDescription ? [candidate.sourceDescription] : []),
    ])

    let glossaryId: string | undefined
    let billedCharacters = 0
    let translations: { text: string; billedCharacters: number }[] = []

    if (texts.length === 0) {
        console.log("Bütün adlar formülle bestelendi ve çevrilecek açıklama yok — DeepL çağrılmadı.")
    } else {
        const apiKey = process.env.DEEPL_API_KEY?.trim()
        if (!apiKey) throw new Error("DEEPL_API_KEY is required for --generate")

        glossaryId = process.env.DEEPL_GLOSSARY_ID?.trim() || undefined
        const translator = new DeepLTranslator({ apiKey, glossaryId })
        const usage = await translator.getUsage()

        assertDeepLQuotaAvailable(usage, estimatedCharacters)
        console.log(JSON.stringify({ deepLUsage: usage }, null, 2))

        translations = await translator.translateTexts({
            texts,
            sourceLocale: SOURCE_LOCALE,
            targetLocale: options.targetLocale,
            context: CONTEXT,
        })
        billedCharacters = translations.reduce(
            (total, translation) => total + translation.billedCharacters,
            0,
        )
    }

    let translationIndex = 0
    const translatedProducts = candidates.map((candidate) => {
        let name: string
        if (candidate.composedName) {
            name = candidate.composedName
        } else {
            const translated = translations[translationIndex++]?.text
            if (!translated) {
                throw new Error(`DeepL did not return a name translation for product ${candidate.code}`)
            }
            name = translated
        }

        const description = candidate.sourceDescription
            ? translations[translationIndex++]?.text ?? null
            : null

        return { name, description }
    })
    const draft = createProductTranslationDraft({
        targetLocale: options.targetLocale,
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

    const composedByCode = new Map(candidates.map((candidate) => [candidate.code, candidate.composedName]))
    console.table(draft.entries.map((entry) => ({
        code: entry.productCode,
        sourceName: entry.source.name,
        targetName: entry.target.name,
        nameSource: composedByCode.get(entry.productCode) ? "formül" : "DeepL",
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
                        where: { locale: { in: [SOURCE_LOCALE, draft.targetLocale] } },
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

    const { localeRuns, applyPaths, ...shared } = options
    // `--target-locale all` ve çok sayıda `--apply` diller arasında SIRAYLA yürür;
    // biri hata verirse sonrakiler denenmez (yarım uygulanmış çoklu-dil durumu
    // yaratmaktansa erken durmak yeğdir).
    const multiRun = localeRuns.length > 1 || applyPaths.length > 1

    try {
        if (options.mode === "apply") {
            for (const applyPath of applyPaths) {
                if (multiRun) console.log(`\n── apply: ${applyPath} ──`)
                await applyDraft(prisma, applyPath)
            }
        } else {
            for (const run of localeRuns) {
                if (multiRun) console.log(`\n══════ ${run.targetLocale} ══════`)
                const runOptions: RunOptions = { ...shared, ...run }
                if (options.mode === "generate") await generateDraft(prisma, runOptions)
                else await loadTranslationCandidates(prisma, runOptions)
            }
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
    // Kullanım hatalarında (ör. geçersiz --target-locale) yığın izi değil, tek
    // satırlık mesaj basılır — diğer dört CLI ile aynı davranış.
    const message = error instanceof Error ? error.message : "Unknown product translation error"
    console.error(message)
    process.exitCode = 1
})
