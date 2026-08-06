import { describe, expect, it } from "vitest"
import { z } from "zod"

import { TARGET_LOCALES } from "./locales"
import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    TranslationTargetLocaleError,
    assertDraftTargetLanguageMatches,
    buildTranslationDraftPath,
    parseTargetLocaleOption,
    translationDraftHeaderShape,
} from "./translationDraft"

const headerSchema = z
    .object(translationDraftHeaderShape)
    .superRefine(assertDraftTargetLanguageMatches)

function header(overrides: Record<string, unknown> = {}) {
    return {
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        sourceLocale: "tr",
        targetLocale: "de",
        deeplTargetLanguage: "de",
        generatedAt: "2026-07-31T00:00:00.000Z",
        glossaryId: null,
        estimatedCharacters: 0,
        billedCharacters: 0,
        ...overrides,
    }
}

describe("parseTargetLocaleOption", () => {
    it("verilmezse İngilizce'ye düşer", () => {
        expect(parseTargetLocaleOption(undefined)).toBe("en")
    })

    it("desteklenen her hedef dili kabul eder", () => {
        for (const locale of TARGET_LOCALES) {
            expect(parseTargetLocaleOption(locale)).toBe(locale)
        }
    })

    it("büyük harf ve boşluğu tolere eder", () => {
        expect(parseTargetLocaleOption("  DE ")).toBe("de")
    })

    it("varsayılan dili HEDEF olarak reddeder", () => {
        // Türkçe kaynak dildir; hedef olarak verilirse CLI kaydı kendi üstüne yazardı.
        expect(() => parseTargetLocaleOption("tr")).toThrow(TranslationTargetLocaleError)
    })

    it("bilinmeyen kodu reddeder", () => {
        expect(() => parseTargetLocaleOption("xx")).toThrow(TranslationTargetLocaleError)
        expect(() => parseTargetLocaleOption("en-GB")).toThrow(TranslationTargetLocaleError)
    })
})

describe("buildTranslationDraftPath", () => {
    it("hedef dili dosya adına koyar", () => {
        // Aynı entity'nin 13 hedefi aynı anda incelemede bekleyebilir; `flag:"wx"`
        // koruması ancak yollar farklıysa iş görür.
        expect(buildTranslationDraftPath("category", "de"))
            .toBe(".translation-drafts/category-tr-de.json")
        expect(buildTranslationDraftPath("category", "en"))
            .not.toBe(buildTranslationDraftPath("category", "de"))
    })
})

describe("taslak başlığı", () => {
    it("sürüm 1 taslaklarını reddeder", () => {
        // Sürüm 1'de hedef dil "en" varsayılıyordu; sessizce kabul etmek eski bir
        // taslağı yanlış dile yazma riski demek.
        expect(headerSchema.safeParse(header({ schemaVersion: 1 })).success).toBe(false)
    })

    /**
     * Kaynak dil eskiden `tr` literaliydi. Pivot çeviri için genişletildi:
     * doğrulanmış İngilizce satırlardan çevirmek (en→X), tr→X'ten belirgin
     * biçimde daha iyi sonuç veriyor. GENİŞLETME olduğu için mevcut
     * `sourceLocale: "tr"` taslakları aynen geçerli — şema sürümü artmadı.
     */
    it("kaynak dil olarak desteklenen her dili kabul eder", () => {
        expect(headerSchema.safeParse(header({ sourceLocale: "tr" })).success).toBe(true)
        expect(headerSchema.safeParse(header({ sourceLocale: "en" })).success).toBe(true)
    })

    it("desteklenmeyen kaynak dilini reddeder", () => {
        expect(headerSchema.safeParse(header({ sourceLocale: "xx" })).success).toBe(false)
    })

    it("hedef dil olarak varsayılan dili kabul etmez", () => {
        expect(headerSchema.safeParse(header({ targetLocale: "tr" })).success).toBe(false)
    })

    it("deeplTargetLanguage hedef dille tutarsızsa reddeder", () => {
        const result = headerSchema.safeParse(
            header({ targetLocale: "de", deeplTargetLanguage: "en-GB" }),
        )

        expect(result.success).toBe(false)
        expect(result.error?.issues[0].message).toContain('must be "de"')
    })

    it("bölgeli kodları doğru eşler", () => {
        expect(headerSchema.safeParse(
            header({ targetLocale: "pt", deeplTargetLanguage: "pt-BR" }),
        ).success).toBe(true)
        expect(headerSchema.safeParse(
            header({ targetLocale: "zh", deeplTargetLanguage: "zh-HANS" }),
        ).success).toBe(true)
        expect(headerSchema.safeParse(
            header({ targetLocale: "pt", deeplTargetLanguage: "pt-PT" }),
        ).success).toBe(false)
    })
})
