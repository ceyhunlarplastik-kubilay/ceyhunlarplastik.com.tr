import { describe, expect, it } from "vitest"

import {
    ProductAttributeTranslationInputError,
    normalizeProductAttributeTranslations,
    normalizeProductAttributeValueTranslations,
} from "./productAttributeTranslations"

describe("normalizeProductAttributeTranslations", () => {
    it("uses the legacy name as the required TR source translation", () => {
        const result = normalizeProductAttributeTranslations({
            legacyName: "Sektör",
            translations: [{ locale: "en", name: "Sector" }],
            requireTurkish: true,
        })

        expect(result.turkish).toEqual({ locale: "tr", name: "Sektör" })
        expect(result.translations).toContainEqual({ locale: "en", name: "Sector" })
    })

    it("rejects a conflicting explicit TR name", () => {
        expect(() => normalizeProductAttributeTranslations({
            legacyName: "Sektör",
            translations: [{ locale: "tr", name: "Sector" }],
        })).toThrow(ProductAttributeTranslationInputError)
    })
})

describe("normalizeProductAttributeValueTranslations", () => {
    it("normalizes names and localized slugs", () => {
        const result = normalizeProductAttributeValueTranslations({
            legacyName: "Mobilya Aksesuarları",
            translations: [{ locale: "en", name: "Furniture Accessories" }],
            requireTurkish: true,
        })

        expect(result.turkish).toEqual({
            locale: "tr",
            name: "Mobilya Aksesuarları",
            slug: "mobilya-aksesuarlari",
        })
        expect(result.translations).toContainEqual({
            locale: "en",
            name: "Furniture Accessories",
            slug: "furniture-accessories",
        })
    })

    it("rejects duplicate locales", () => {
        expect(() => normalizeProductAttributeValueTranslations({
            translations: [
                { locale: "en", name: "Handles" },
                { locale: "en", name: "Grips" },
            ],
        })).toThrow(ProductAttributeTranslationInputError)
    })
})
