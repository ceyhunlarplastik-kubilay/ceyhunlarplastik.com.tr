import { describe, expect, it } from "vitest"

import {
    ProductTranslationInputError,
    normalizeProductTranslations,
} from "./productTranslations"

describe("productTranslations", () => {
    it("normalizes TR legacy fields and EN translation slug", () => {
        const result = normalizeProductTranslations({
            legacyName: "Bakalit Tutamak",
            legacySlug: "bakalit-tutamak",
            legacyDescription: "Türkçe açıklama",
            translations: [{
                locale: "en",
                name: "Bakelite Handle",
                description: "English description",
            }],
            requireTurkish: true,
        })

        expect(result.translations).toEqual([
            {
                locale: "tr",
                name: "Bakalit Tutamak",
                slug: "bakalit-tutamak",
                description: "Türkçe açıklama",
            },
            {
                locale: "en",
                name: "Bakelite Handle",
                slug: "bakelite-handle",
                description: "English description",
            },
        ])
    })

    it("skips empty target translations so existing EN rows are preserved", () => {
        const result = normalizeProductTranslations({
            legacyName: "Bakalit Tutamak",
            legacySlug: "bakalit-tutamak",
            translations: [{
                locale: "en",
                name: "",
                slug: "",
                description: "",
            }],
            requireTurkish: true,
        })

        expect(result.translations).toHaveLength(1)
        expect(result.translations[0].locale).toBe("tr")
    })

    it("rejects duplicate locales", () => {
        expect(() => normalizeProductTranslations({
            translations: [
                { locale: "en", name: "One" },
                { locale: "en", name: "Two" },
            ],
        })).toThrow(ProductTranslationInputError)
    })
})
