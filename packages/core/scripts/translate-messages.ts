import "dotenv/config"

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { z } from "zod"

import {
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    estimateTranslationCharacters,
} from "../src/core/i18n/deeplTranslator"
import { getDeepLTargetLanguage } from "../src/core/i18n/deeplLanguages"
import type { TargetLocale } from "../src/core/i18n/locales"
import {
    MessageCatalogError,
    applyTranslations,
    collectMissingKeys,
    findIncompleteArrays,
    flattenCatalog,
    getAtPath,
    validateTranslatedEntries,
    type MessageNode,
} from "../src/core/i18n/messageCatalog"
import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    TRANSLATION_DRAFT_SOURCE_LOCALE,
    assertDraftTargetLanguageMatches,
    buildTranslationDraftPath,
    parseTargetLocaleOption,
    translationDraftHeaderShape,
} from "../src/core/i18n/translationDraft"

const SOURCE_LOCALE = TRANSLATION_DRAFT_SOURCE_LOCALE
const DRAFT_ENTITY = "messages"
const MESSAGES_DIR = fileURLToPath(new URL("../../frontend/messages", import.meta.url))
const MESSAGE_TRANSLATION_CONTEXT = [
    "Bu metinler endüstriyel plastik üretimi yapan bir şirketin kurumsal web",
    "sitesinin arayüz metinleridir. Kısa, doğal ve pazarlama diline uygun çevir.",
    "Süslü parantez içindeki yer tutucuları ({count} gibi) ve açılı parantezli",
    "etiketleri (<highlight> gibi) AYNEN KORU, içlerindeki adları çevirme.",
].join(" ")

const messagesDraftSchema = z.object({
    ...translationDraftHeaderShape,
    entity: z.literal(DRAFT_ENTITY),
    entries: z.array(z.object({
        key: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
    }).strict()),
}).strict().superRefine((draft, context) => {
    assertDraftTargetLanguageMatches(draft, context)

    const keys = new Set<string>()
    for (const [index, entry] of draft.entries.entries()) {
        if (keys.has(entry.key)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate key: ${entry.key}`,
                path: ["entries", index, "key"],
            })
        }
        keys.add(entry.key)
    }
})

type MessagesDraft = z.infer<typeof messagesDraftSchema>

type CliMode = "plan" | "generate" | "apply"

type CliOptions = {
    mode: CliMode
    targetLocale: TargetLocale
    applyPath?: string
    outputPath: string
    limit?: number
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
            "target-locale": { type: "string" },
            output: { type: "string" },
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

    if (mode === "apply" && limit) {
        throw new Error("--limit cannot be used with --apply")
    }

    const targetLocale = parseTargetLocaleOption(values["target-locale"])

    return {
        mode,
        targetLocale,
        applyPath: values.apply,
        outputPath: values.output ?? buildTranslationDraftPath(DRAFT_ENTITY, targetLocale),
        limit,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log([
        "Generate and apply reviewed messages/*.json catalog drafts with DeepL.",
        "",
        "Usage:",
        "  npm --workspace packages/core run translate:messages -- --plan --target-locale de",
        "  npm --workspace packages/core run translate:messages -- --generate --target-locale de",
        "  npm --workspace packages/core run translate:messages -- --apply .translation-drafts/messages-tr-de.json",
        "",
        "Options:",
        "  --plan                  Show missing keys without calling DeepL or writing files (default)",
        "  --generate              Call DeepL and create a review draft without writing the catalog",
        "  --apply <path>          Validate and apply a reviewed draft to messages/<locale>.json",
        "  --target-locale <code>  Target locale (default: en); one of the supported locales",
        "  --output <path>         Draft output path (default: .translation-drafts/messages-tr-<locale>.json)",
        "  --limit <number>        Limit keys during plan/generate",
        "  -h, --help              Show this help",
        "",
        "Environment:",
        "  DEEPL_API_KEY is required only for --generate.",
        "  DEEPL_GLOSSARY_ID is optional for --generate.",
        "",
        "Existing (non-empty) catalog keys are never overwritten.",
        "ICU placeholders, rich-text tags, and array lengths are validated before writing.",
    ].join("\n"))
}

function catalogPath(locale: string) {
    return path.join(MESSAGES_DIR, `${locale}.json`)
}

async function readCatalog(locale: string): Promise<MessageNode> {
    const filePath = catalogPath(locale)

    try {
        return JSON.parse(await readFile(filePath, "utf8")) as MessageNode
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            // Henüz hiç çevrilmemiş bir dil: boş katalogla başlanır.
            return {}
        }
        throw new MessageCatalogError(`Catalog is not valid JSON: ${filePath}`)
    }
}

async function planTranslation(options: CliOptions) {
    const reference = await readCatalog(SOURCE_LOCALE)
    const target = await readCatalog(options.targetLocale)
    const allMissing = collectMissingKeys(reference, target)
    const missing = options.limit ? allMissing.slice(0, options.limit) : allMissing
    const estimatedCharacters = estimateTranslationCharacters(missing.map(({ source }) => source))

    console.log(JSON.stringify({
        sourceLocale: SOURCE_LOCALE,
        targetLocale: options.targetLocale,
        deeplTargetLanguage: getDeepLTargetLanguage(options.targetLocale),
        referenceKeys: flattenCatalog(reference).size,
        missingKeys: allMissing.length,
        selectedKeys: missing.length,
        estimatedCharacters,
    }, null, 2))

    if (missing.length > 0) {
        console.table(missing.slice(0, 20).map(({ key, source }) => ({
            key,
            source: source.slice(0, 60),
        })))
        if (missing.length > 20) console.log(`… ve ${missing.length - 20} anahtar daha`)
    }

    return { missing, estimatedCharacters }
}

async function generateDraft(options: CliOptions) {
    const { missing, estimatedCharacters } = await planTranslation(options)

    if (missing.length === 0) {
        console.log(`No missing ${options.targetLocale} keys; DeepL was not called.`)
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
        texts: missing.map(({ source }) => source),
        sourceLocale: SOURCE_LOCALE,
        targetLocale: options.targetLocale,
        context: MESSAGE_TRANSLATION_CONTEXT,
    })

    if (translations.length !== missing.length) {
        throw new MessageCatalogError(
            `Expected ${missing.length} translations, received ${translations.length}`,
        )
    }

    const entries = missing.map(({ key, source }, index) => ({
        key,
        source,
        target: translations[index].text,
    }))
    const billedCharacters = translations.reduce(
        (total, translation) => total + translation.billedCharacters,
        0,
    )

    // Doğrulama taslak ÜRETİMİNDE de çalışır: bozuk yer tutucular incelemeden
    // önce görünsün, insan gözü 800 satırda onları aramasın.
    const problems = validateTranslatedEntries(entries)

    const draft: MessagesDraft = messagesDraftSchema.parse({
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        entity: DRAFT_ENTITY,
        sourceLocale: SOURCE_LOCALE,
        targetLocale: options.targetLocale,
        deeplTargetLanguage: getDeepLTargetLanguage(options.targetLocale),
        generatedAt: new Date().toISOString(),
        glossaryId: glossaryId ?? null,
        estimatedCharacters,
        billedCharacters,
        entries,
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

    console.log(`Review draft created: ${outputPath}`)
    console.log(`Keys: ${entries.length} · billed characters: ${billedCharacters}`)

    if (problems.length > 0) {
        console.warn(`\n⚠ ${problems.length} placeholder/tag problems to review before --apply:`)
        for (const problem of problems.slice(0, 30)) console.warn(`  - ${problem}`)
        if (problems.length > 30) console.warn(`  … ve ${problems.length - 30} sorun daha`)
    }

    console.log("No catalog file was written.")
}

async function applyDraft(options: CliOptions) {
    if (!options.applyPath) throw new Error("--apply requires a draft path")

    const absolutePath = path.resolve(options.applyPath)

    // Okuma ve ayrıştırma AYRI: ikisi aynı catch'te toplandığında var olmayan bir
    // dosya "Draft is not valid JSON" diye raporlanıyordu ve yol hatası JSON hatası
    // gibi görünüyordu. Ayrıca yolun neye göre çözüldüğü mesajda görünmeli — bu
    // script npm workspace ile packages/core içinden çalışıyor.
    let content: string
    try {
        content = await readFile(absolutePath, "utf8")
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            throw new MessageCatalogError(
                `Draft not found: ${absolutePath}\n` +
                `(relative paths resolve from ${process.cwd()})`,
            )
        }
        throw error
    }

    let input: unknown
    try {
        input = JSON.parse(content)
    } catch {
        throw new MessageCatalogError(`Draft is not valid JSON: ${absolutePath}`)
    }

    const parsed = messagesDraftSchema.safeParse(input)
    if (!parsed.success) {
        const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`)
            .join("; ")
        throw new MessageCatalogError(`Invalid messages draft: ${details}`)
    }

    const draft = parsed.data
    const reference = await readCatalog(draft.sourceLocale)
    const target = await readCatalog(draft.targetLocale)

    // Kaynak taslak üretildikten sonra değişmiş olabilir; değişen anahtarı
    // eski çeviriyle yazmak sessiz bir tutarsızlık üretirdi.
    const drifted = draft.entries.filter((entry) =>
        JSON.stringify(getAtPath(reference, entry.key)) !== JSON.stringify(entry.source),
    )

    if (drifted.length > 0) {
        throw new MessageCatalogError([
            `${drifted.length} source messages changed after the draft was generated:`,
            ...drifted.slice(0, 10).map(({ key }) => `  - ${key}`),
        ].join("\n"))
    }

    // Bu arada elle çevrilmiş anahtarı ezme.
    const stillMissing = new Set(collectMissingKeys(reference, target).map(({ key }) => key))
    const writable = draft.entries.filter((entry) => stillMissing.has(entry.key))
    const skipped = draft.entries.length - writable.length

    const problems = validateTranslatedEntries(writable)
    if (problems.length > 0) {
        throw new MessageCatalogError([
            `${problems.length} messages failed ICU/tag/array validation; nothing was written:`,
            ...problems.slice(0, 30).map((problem) => `  - ${problem}`),
        ].join("\n"))
    }

    const nextCatalog = applyTranslations(target, writable)

    // Diziler ya tamamen çevrilir ya hiç: birleştirme dizileri bütün olarak
    // değiştirdiği için yarım bir dizi o dilde İÇERİK KAYBI demek.
    const incomplete = findIncompleteArrays(reference, nextCatalog)
    if (incomplete.length > 0) {
        throw new MessageCatalogError([
            `${incomplete.length} arrays would be left partially translated; nothing was written.`,
            "Arrays are replaced as a whole when catalogs merge, so a half-filled array hides items.",
            ...incomplete.slice(0, 10).map(({ arrayPath, missingKeys }) =>
                `  - ${arrayPath}: ${missingKeys.length} missing (e.g. ${missingKeys[0]})`,
            ),
        ].join("\n"))
    }

    const filePath = catalogPath(draft.targetLocale)

    await writeFile(filePath, `${JSON.stringify(nextCatalog, null, 4)}\n`, "utf8")

    console.log(JSON.stringify({
        draft: absolutePath,
        catalog: filePath,
        written: writable.length,
        skippedAlreadyTranslated: skipped,
    }, null, 2))
}

async function main() {
    const options = parseCliOptions()
    if (options.showHelp) {
        printHelp()
        return
    }

    if (options.mode === "plan") {
        await planTranslation(options)
    } else if (options.mode === "generate") {
        await generateDraft(options)
    } else {
        await applyDraft(options)
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown message translation error"
    console.error(message)
    process.exitCode = 1
})
