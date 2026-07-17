import { describe, expect, it } from "vitest"

import type { Category } from "./types"
import { normalizeCategory } from "./normalizeCategory"

describe("normalizeCategory", () => {
    it("normalizes a legacy Category payload during a rolling deploy", () => {
        const legacyCategory = {
            id: "category-1",
            code: 10,
            name: "Bakalit Tutamaklar",
            slug: "bakalit-tutamaklar",
            createdAt: "2026-07-16T00:00:00.000Z",
            updatedAt: "2026-07-16T00:00:00.000Z",
        } as Category

        const category = normalizeCategory(legacyCategory, "en")

        expect(category.locale).toBe("en")
        expect(category.resolvedLocale).toBe("tr")
        expect(category.translationMissing).toBe(true)
        expect(category.alternateSlugs).toEqual({ tr: "bakalit-tutamaklar" })
        expect(category.translations).toEqual([])
    })
})
