import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"

import { SUPPORTED_LOCALES, TARGET_LOCALES } from "../src/core/i18n/locales"
import type { SupportedLocale, TargetLocale } from "../src/core/i18n/locales"
import {
    TRANSLATION_DRAFT_SOURCE_LOCALE,
    buildTranslationDraftPath,
} from "../src/core/i18n/translationDraft"

/**
 * İçerik çevirisi sürücüsü: 5 entity × 13 hedef dili sırayla yürütür.
 *
 * Kendi çeviri mantığı YOKTUR — mevcut beş CLI'yı olduğu gibi çağırır. Amaç
 * 65 komutu elle yazmayı ve hangisinin yapıldığını takip etmeyi ortadan
 * kaldırmak; davranışı değiştirmek değil.
 *
 * `--apply` BİLEREK DESTEKLENMEZ. Taslak incelemesi E4'te insana bırakıldı:
 * DeepL çıktısı veritabanına yazılmadan önce bir insanın bakması gerekiyor.
 * Sürücü `--generate` bitince uygulanacak komutları listeler, çalıştırmaz.
 *
 * Kullanım (sst shell içinden, DB ve DEEPL_API_KEY ortamda olmalı):
 *   npm --workspace packages/core run translate:content -- --mode plan
 *   npm --workspace packages/core run translate:content -- --mode generate --locales ko,ja,zh,hi
 */

/** entity anahtarı → (CLI dosyası, taslak dosya adındaki entity adı) */
const ENTITIES = {
    category: {
        script: "translate-category-translations.ts",
        draftEntity: "category",
        supportsSourceLocale: false,
    },
    product: {
        script: "translate-product-translations.ts",
        draftEntity: "products",
        supportsSourceLocale: false,
    },
    // Pivot çeviriyi şimdilik yalnız taksonomi destekliyor: EN satırları insan
    // gözüyle doğrulanmış olduğu için en->X, tr->X'ten daha iyi sonuç veriyor.
    // Diğer entity'ler istenirse aynı desenle açılabilir.
    "product-taxonomy": {
        script: "translate-product-taxonomy-translations.ts",
        draftEntity: "product-taxonomy",
        supportsSourceLocale: true,
    },
    "variant-dictionary": {
        script: "translate-variant-dictionary-translations.ts",
        draftEntity: "variant-dictionaries",
        supportsSourceLocale: false,
    },
    "product-industrial-usage": {
        script: "translate-product-industrial-usage-translations.ts",
        draftEntity: "product-industrial-usages",
        supportsSourceLocale: false,
    },
} as const

type EntityKey = keyof typeof ENTITIES
const ENTITY_KEYS = Object.keys(ENTITIES) as EntityKey[]

type Mode = "plan" | "generate"
type Status = "ok" | "nothing-to-do" | "draft-exists" | "failed"

type StepResult = {
    entity: EntityKey
    locale: TargetLocale
    status: Status
    candidates?: number
    estimatedCharacters?: number
    draftPath?: string
    detail?: string
}

function parseList<T extends string>(
    raw: string | undefined,
    allowed: readonly T[],
    label: string,
): T[] {
    if (!raw) return [...allowed]

    const requested = raw.split(",").map((value) => value.trim()).filter(Boolean)
    const invalid = requested.filter((value) => !allowed.includes(value as T))

    if (invalid.length > 0) {
        throw new Error(
            `${label} geçersiz: ${invalid.join(", ")}\nKabul edilenler: ${allowed.join(", ")}`,
        )
    }

    return requested as T[]
}

function parseCliOptions() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: false,
        strict: true,
        options: {
            mode: { type: "string" },
            locales: { type: "string" },
            entities: { type: "string" },
            "source-locale": { type: "string" },
            apply: { type: "string" },
            help: { type: "boolean", short: "h" },
        },
    })

    if (values.apply !== undefined) {
        throw new Error(
            [
                "--apply bu sürücüde desteklenmiyor.",
                "",
                "Taslakların veritabanına yazılması bilinçli olarak elle yapılıyor:",
                "DeepL çıktısı incelenmeden yazılmamalı. Önce --mode generate ile",
                "taslakları üretin, gözden geçirin, sonra her taslağı kendi CLI'sıyla",
                "uygulayın. Sürücü generate sonunda komutları listeler.",
            ].join("\n"),
        )
    }

    const mode = (values.mode ?? "plan") as Mode
    if (mode !== "plan" && mode !== "generate") {
        throw new Error("--mode yalnız 'plan' veya 'generate' olabilir")
    }

    const entities = parseList(values.entities, ENTITY_KEYS, "--entities")
    const locales = parseList(values.locales, TARGET_LOCALES, "--locales")
    const rawSourceLocale = values["source-locale"]?.trim().toLowerCase()
    if (rawSourceLocale && !SUPPORTED_LOCALES.includes(rawSourceLocale as SupportedLocale)) {
        throw new Error(
            `--source-locale geçersiz: ${rawSourceLocale}\nKabul edilenler: ${SUPPORTED_LOCALES.join(", ")}`,
        )
    }
    const sourceLocale = (rawSourceLocale ?? TRANSLATION_DRAFT_SOURCE_LOCALE) as SupportedLocale

    if (rawSourceLocale) {
        // Sessizce yok saymak, kullanıcının pivot çeviri yaptığını sanıp tr'den
        // çevrilmiş taslak üretmesine yol açardı — açıkça reddediliyor.
        const unsupported = entities.filter((entity) => !ENTITIES[entity].supportsSourceLocale)
        if (unsupported.length > 0) {
            throw new Error(
                `--source-locale şu entity'lerde desteklenmiyor: ${unsupported.join(", ")}\n` +
                `Destekleyenler: ${ENTITY_KEYS.filter((key) => ENTITIES[key].supportsSourceLocale).join(", ")}`,
            )
        }
        if (locales.includes(sourceLocale as TargetLocale)) {
            throw new Error(
                `--source-locale "${sourceLocale}" hedef listesinde de var; bir dil kendinden çevrilemez.`,
            )
        }
    }

    return {
        mode,
        locales,
        entities,
        sourceLocale,
        showHelp: values.help ?? false,
    }
}

function printHelp() {
    console.log([
        "İçerik çevirisi sürücüsü — 5 entity × 13 dili sırayla yürütür.",
        "",
        "Kullanım:",
        "  npm --workspace packages/core run translate:content -- --mode plan",
        "  npm --workspace packages/core run translate:content -- --mode generate --locales ko,ja",
        "",
        "Seçenekler:",
        "  --mode plan|generate   plan: DeepL çağırmaz, DB'ye yazmaz (varsayılan)",
        "                         generate: DeepL çağırır, taslak üretir, DB'ye YAZMAZ",
        `  --locales <csv>        Varsayılan: hepsi (${TARGET_LOCALES.join(", ")})`,
        `  --entities <csv>       Varsayılan: hepsi (${ENTITY_KEYS.join(", ")})`,
        `  --source-locale <code> Çevirinin YAPILDIĞI dil (varsayılan: ${TRANSLATION_DRAFT_SOURCE_LOCALE}).`,
        "                         en verilirse doğrulanmış İngilizce satırlar pivot alınır;",
        "                         DeepL'in en->X kalitesi tr->X'ten belirgin biçimde yüksek.",
        `                         Şimdilik yalnız: ${ENTITY_KEYS.filter((key) => ENTITIES[key].supportsSourceLocale).join(", ")}`,
        "  -h, --help             Bu yardım",
        "",
        "--apply desteklenmez: taslaklar incelenmeden veritabanına yazılmamalı.",
        "",
        "Ortam: sst shell içinden çalıştırın (DIRECT_URL/DATABASE_URL gerekir).",
        "DEEPL_API_KEY yalnız --mode generate için gerekir.",
    ].join("\n"))
}

/** İlk JSON bloğundaki sayısal alanı çeker; bulunamazsa undefined. */
function readNumericField(output: string, field: string): number | undefined {
    const match = new RegExp(`"${field}":\\s*(\\d+)`).exec(output)
    return match ? Number(match[1]) : undefined
}

function runStep(
    entity: EntityKey,
    locale: TargetLocale,
    mode: Mode,
    sourceLocale: SupportedLocale,
): StepResult {
    const { script, draftEntity, supportsSourceLocale } = ENTITIES[entity]
    const usesSourceLocale = supportsSourceLocale && sourceLocale !== TRANSLATION_DRAFT_SOURCE_LOCALE
    // Taslak yolu kaynak dili taşır; tr kaynaklı eski taslaklarla çakışmaz.
    const draftPath = buildTranslationDraftPath(
        draftEntity,
        locale,
        usesSourceLocale ? sourceLocale : undefined,
    )
    const modeFlag = mode === "plan" ? "--plan" : "--generate"

    console.log(`\n───── ${entity}: ${usesSourceLocale ? sourceLocale : TRANSLATION_DRAFT_SOURCE_LOCALE} → ${locale} (${mode}) ─────`)

    // Taslak zaten varsa CLI `flag: "wx"` yüzünden hata verir. Bu bir başarısızlık
    // değil, "bu adım daha önce yapılmış" demektir — sürücünün yeniden
    // çalıştırılabilir olması buna bağlı.
    if (mode === "generate" && existsSync(path.resolve(draftPath))) {
        console.log(`Taslak zaten var, atlanıyor: ${draftPath}`)
        return { entity, locale, status: "draft-exists", draftPath }
    }

    const result = spawnSync(
        "npx",
        [
            "tsx",
            `prisma/${script}`,
            modeFlag,
            "--target-locale",
            locale,
            ...(usesSourceLocale ? ["--source-locale", sourceLocale] : []),
        ],
        { encoding: "utf8", env: process.env },
    )

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
    process.stdout.write(output)

    const candidates = readNumericField(output, "candidates")
    const estimatedCharacters = readNumericField(output, "estimatedCharacters")

    if (result.status !== 0) {
        const detail = (result.stderr ?? "").trim().split("\n").pop() ?? "bilinmeyen hata"
        return { entity, locale, status: "failed", candidates, estimatedCharacters, detail }
    }

    if (candidates === 0) {
        return { entity, locale, status: "nothing-to-do", candidates: 0 }
    }

    return {
        entity,
        locale,
        status: "ok",
        candidates,
        estimatedCharacters,
        draftPath: mode === "generate" ? draftPath : undefined,
    }
}

function printSummary(results: StepResult[], mode: Mode) {
    console.log("\n\n═════ ÖZET ═════\n")

    console.table(results.map((result) => ({
        entity: result.entity,
        locale: result.locale,
        durum: result.status,
        aday: result.candidates ?? "-",
        karakter: result.estimatedCharacters ?? "-",
        not: result.detail ?? "",
    })))

    const totalCharacters = results.reduce(
        (total, result) => total + (result.estimatedCharacters ?? 0),
        0,
    )
    const failed = results.filter((result) => result.status === "failed")

    console.log(JSON.stringify({
        mode,
        adım: results.length,
        başarılı: results.filter((r) => r.status === "ok").length,
        yapılacakYok: results.filter((r) => r.status === "nothing-to-do").length,
        taslakVar: results.filter((r) => r.status === "draft-exists").length,
        başarısız: failed.length,
        toplamTahminiKarakter: totalCharacters,
    }, null, 2))

    const drafts = results.filter((result) => result.draftPath && result.status === "ok")

    if (mode === "generate" && drafts.length > 0) {
        console.log([
            "\nTaslaklar üretildi. İNCELEDİKTEN SONRA aşağıdaki komutlarla uygulayın",
            "(sürücü bunları bilinçli olarak çalıştırmaz):\n",
        ].join("\n"))

        for (const draft of drafts) {
            const { script } = ENTITIES[draft.entity]
            const npmScript = script.replace(/^translate-/, "translate:").replace(/\.ts$/, "")
            console.log(
                `  npm --workspace packages/core run ${npmScript} -- --apply ${draft.draftPath}`,
            )
        }
    }

    if (failed.length > 0) {
        console.error(`\n${failed.length} adım başarısız oldu.`)
        process.exitCode = 1
    }
}

function main() {
    const options = parseCliOptions()
    if (options.showHelp) {
        printHelp()
        return
    }

    console.log(JSON.stringify({
        mode: options.mode,
        sourceLocale: options.sourceLocale,
        entities: options.entities,
        locales: options.locales,
        adımSayısı: options.entities.length * options.locales.length,
    }, null, 2))

    const results: StepResult[] = []

    // Sıralı çalışıyor, paralel DEĞİL: DeepL kotası ve DB bağlantı sayısı
    // paralellikten zarar görür, ayrıca çıktının okunabilir kalması gerekiyor.
    for (const entity of options.entities) {
        for (const locale of options.locales) {
            results.push(runStep(entity, locale, options.mode, options.sourceLocale))
        }
    }

    printSummary(results, options.mode)
}

try {
    main()
} catch (error) {
    console.error(error instanceof Error ? error.message : "Bilinmeyen sürücü hatası")
    process.exitCode = 1
}
