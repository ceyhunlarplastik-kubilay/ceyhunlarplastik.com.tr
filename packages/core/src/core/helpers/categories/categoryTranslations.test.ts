import { describe, expect, it } from "vitest"

import {
    CategoryTranslationInputError,
    normalizeCategoryTranslations,
} from "./categoryTranslations"

describe("normalizeCategoryTranslations", () => {
    it("creates canonical TR and EN translation writes", () => {
        const result = normalizeCategoryTranslations({
            legacyName: "Bakalit Tutamaklar",
            translations: [
                { locale: "en", name: "Bakelite Handles" },
            ],
            requireTurkish: true,
        })

        expect(result.turkish).toEqual({
            locale: "tr",
            name: "Bakalit Tutamaklar",
            slug: "bakalit-tutamaklar",
        })
        expect(result.translations).toContainEqual({
            locale: "en",
            name: "Bakelite Handles",
            slug: "bakelite-handles",
        })
    })

    it("rejects duplicate locales", () => {
        expect(() => normalizeCategoryTranslations({
            translations: [
                { locale: "en", name: "First Name" },
                { locale: "en", name: "Second Name" },
            ],
        })).toThrow(CategoryTranslationInputError)
    })

    it("rejects conflicting legacy and TR names", () => {
        expect(() => normalizeCategoryTranslations({
            legacyName: "Bakalit Tutamaklar",
            translations: [
                { locale: "tr", name: "Farklı Ad" },
            ],
        })).toThrow("name and the TR translation name must match")
    })
})
