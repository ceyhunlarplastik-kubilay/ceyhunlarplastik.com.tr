import { createHash } from "node:crypto"
import { z } from "zod"

import { getDeepLTargetLanguage } from "./deeplLanguages"
import {
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    TARGET_LOCALES,
    isSupportedLocale,
    type SupportedLocale,
    type TargetLocale,
} from "./locales"

/**
 * SÜRÜM 2: taslaklar artık tek bir hedef dile (`en`) çivili değil; başlıkta
 * `targetLocale` serbest bir hedef dil ve `deeplTargetLanguage` ona göre
 * türetiliyor. Sürüm 1 taslakları bilinçli olarak REDDEDİLİR — eski bir
 * taslağın hedef dilini "en" varsaymak, yanlış dile yazma riski taşırdı.
 */
export const TRANSLATION_DRAFT_SCHEMA_VERSION = 2 as const

/**
 * Taslakların VARSAYILAN kaynak dili. Artık zorunlu değil: `--source-locale` ile
 * pivot dil seçilebiliyor.
 *
 * NEDEN PİVOT: DeepL'in tr→X kalitesi en→X'ten belirgin biçimde düşük — Türkçe
 * düşük kaynaklı bir dil ve teknik kısaltmalarda daha çok hata yapıyor. İngilizce
 * çevirisi bir kez insan gözüyle doğrulandıktan sonra onu pivot almak, kalan 12
 * dilin tamamını iyileştiriyor.
 */
export const TRANSLATION_DRAFT_SOURCE_LOCALE = DEFAULT_LOCALE

export function countUnicodeCharacters(value: string) {
    return Array.from(value).length
}

export function createTranslationSourceFingerprint({
    entityId,
    sourceLocale,
    fields,
}: {
    entityId: string
    sourceLocale: string
    fields: Record<string, string>
}) {
    const normalizedFields = Object.entries(fields).sort(([left], [right]) =>
        left.localeCompare(right),
    )

    return createHash("sha256")
        .update(JSON.stringify([entityId, sourceLocale, normalizedFields]))
        .digest("hex")
}

export const draftTargetLocaleSchema = z.enum(
    TARGET_LOCALES as [TargetLocale, ...TargetLocale[]],
)

/**
 * Kaynak dil artık `tr` literali DEĞİL — pivot çeviriye izin vermek için
 * genişletildi. Bu bir DARALTMA değil GENİŞLETME olduğu için mevcut
 * `sourceLocale: "tr"` taslakları aynen geçerli kalır; şema sürümü artmadı.
 */
export const draftSourceLocaleSchema = z.enum(
    SUPPORTED_LOCALES as unknown as [SupportedLocale, ...SupportedLocale[]],
)

/**
 * Beş taslak dosyasının ORTAK başlık alanları.
 *
 * Her entity kendi şemasına `...translationDraftHeaderShape` yayar; böylece
 * sürüm/dil sözleşmesi tek yerde değişir. Entity'ye özgü olan yalnız `entity`
 * ayracı ve `entries`.
 */
export const translationDraftHeaderShape = {
    schemaVersion: z.literal(TRANSLATION_DRAFT_SCHEMA_VERSION),
    provider: z.literal("deepl"),
    sourceLocale: draftSourceLocaleSchema,
    targetLocale: draftTargetLocaleSchema,
    deeplTargetLanguage: z.string().min(1),
    generatedAt: z.string().min(1),
    glossaryId: z.string().trim().min(1).nullable(),
    estimatedCharacters: z.number().int().nonnegative(),
    billedCharacters: z.number().int().nonnegative(),
}

/**
 * `deeplTargetLanguage` ile `targetLocale` tutarlı mı?
 *
 * İkisi ayrı alanlar olduğu için elle düzenlenmiş bir taslakta ayrışabilirler:
 * `targetLocale: "de"` ama `deeplTargetLanguage: "en-GB"` gibi bir taslak, hangi
 * dile yazıldığı belirsiz bir kayıt üretirdi.
 */
export function assertDraftTargetLanguageMatches(
    draft: { targetLocale: string; deeplTargetLanguage: string },
    context: z.RefinementCtx,
) {
    if (!isSupportedLocale(draft.targetLocale)) return

    const expected = getDeepLTargetLanguage(draft.targetLocale)
    if (draft.deeplTargetLanguage !== expected) {
        context.addIssue({
            code: "custom",
            message: `deeplTargetLanguage must be "${expected}" for target locale "${draft.targetLocale}"`,
            path: ["deeplTargetLanguage"],
        })
    }
}

/**
 * Taslak dosya yolu: `.translation-drafts/<entity>-<kaynak>-<hedef>.json`
 *
 * Hedef dil ADTA olmak zorunda — aynı entity'nin 13 hedefi aynı anda incelemede
 * bekleyebilir ve `flag: "wx"` koruması yalnız yol farklıysa işe yarar.
 */
export function buildTranslationDraftPath(
    entity: string,
    targetLocale: TargetLocale,
    sourceLocale: SupportedLocale = TRANSLATION_DRAFT_SOURCE_LOCALE,
) {
    return `.translation-drafts/${entity}-${sourceLocale}-${targetLocale}.json`
}

/** CLI `--source-locale` değerini doğrular; verilmezse varsayılan dile düşer. */
export function parseSourceLocaleOption(value: string | undefined): SupportedLocale {
    if (value === undefined) return TRANSLATION_DRAFT_SOURCE_LOCALE

    const normalized = value.trim().toLowerCase()
    if (!isSupportedLocale(normalized)) {
        throw new TranslationTargetLocaleError(
            `--source-locale must be one of: ${SUPPORTED_LOCALES.join(", ")}`,
        )
    }

    return normalized
}

/**
 * Kaynak ve hedef aynı olamaz. DeepL katmanı bunu zaten reddediyor ama hata
 * oraya kadar gitmeden, hangi bayrakların çakıştığı belliyken verilmeli.
 */
export function assertSourceDiffersFromTarget(
    sourceLocale: SupportedLocale,
    targetLocale: TargetLocale,
) {
    if (sourceLocale === targetLocale) {
        throw new TranslationTargetLocaleError(
            `--source-locale and --target-locale cannot both be "${targetLocale}"`,
        )
    }
}

export class TranslationTargetLocaleError extends Error {}

/** CLI `--target-locale` değerini doğrular; verilmezse İngilizce'ye düşer. */
export function parseTargetLocaleOption(value: string | undefined): TargetLocale {
    if (value === undefined) return "en"

    const normalized = value.trim().toLowerCase()
    const match = TARGET_LOCALES.find((locale) => locale === normalized)

    if (!match) {
        throw new TranslationTargetLocaleError(
            `--target-locale must be one of: ${TARGET_LOCALES.join(", ")}`,
        )
    }

    return match
}
