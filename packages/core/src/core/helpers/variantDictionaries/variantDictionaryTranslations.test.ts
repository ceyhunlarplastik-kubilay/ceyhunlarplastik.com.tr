import { describe, expect, it } from "vitest"

import {
    assertNoTranslationLocaleConflict,
    buildVariantDictionaryTranslationWrites,
    normalizeVariantDictionaryTranslations,
    VariantDictionaryTranslationInputError,
} from "./variantDictionaryTranslations"

const buildWhere = (locale: string) => ({ colorId_locale: { colorId: "c1", locale } })

describe("buildVariantDictionaryTranslationWrites", () => {
    it("MEVCUT hedef dil çevirisini de günceller (connectOrCreate regresyonu)", () => {
        // Eskiden hedef diller `connectOrCreate` ile yazılıyordu: satır zaten varsa
        // hiçbir şey yapılmıyordu, yani bir kez girilen İngilizce ad ASLA
        // düzeltilemiyordu. Admin formları da bu yüzden input'u disabled yapıyordu.
        const normalized = normalizeVariantDictionaryTranslations({
            legacyName: "Kırmızı",
            translations: [{ locale: "en", name: "Red" }],
        })

        const writes = buildVariantDictionaryTranslationWrites({
            translations: normalized.translations,
            buildWhere,
        })

        expect(writes).not.toHaveProperty("connectOrCreate")
        expect(writes?.upsert).toEqual([
            {
                where: { colorId_locale: { colorId: "c1", locale: "tr" } },
                create: { locale: "tr", name: "Kırmızı" },
                update: { name: "Kırmızı" },
            },
            {
                where: { colorId_locale: { colorId: "c1", locale: "en" } },
                create: { locale: "en", name: "Red" },
                update: { name: "Red" },
            },
        ])
    })

    it("kaldırılacak diller için deleteMany üretir", () => {
        const writes = buildVariantDictionaryTranslationWrites({
            translations: [],
            removeLocales: ["en", "de"],
            buildWhere,
        })

        expect(writes).toEqual({ deleteMany: { locale: { in: ["en", "de"] } } })
    })

    it("yazacak bir şey yoksa undefined döner — boş nested write gönderilmez", () => {
        expect(
            buildVariantDictionaryTranslationWrites({ translations: [], buildWhere }),
        ).toBeUndefined()
        expect(
            buildVariantDictionaryTranslationWrites({
                translations: [],
                removeLocales: [],
                buildWhere,
            }),
        ).toBeUndefined()
    })
})

describe("assertNoTranslationLocaleConflict", () => {
    it("aynı dil hem güncellenip hem silinemez", () => {
        expect(() =>
            assertNoTranslationLocaleConflict([{ locale: "en", name: "Red" }], ["en"]),
        ).toThrow(VariantDictionaryTranslationInputError)
    })

    it("çakışma yoksa geçer", () => {
        expect(() =>
            assertNoTranslationLocaleConflict([{ locale: "en", name: "Red" }], ["de"]),
        ).not.toThrow()
        expect(() => assertNoTranslationLocaleConflict(undefined, ["de"])).not.toThrow()
        expect(() =>
            assertNoTranslationLocaleConflict([{ locale: "en", name: "Red" }], undefined),
        ).not.toThrow()
    })
})
