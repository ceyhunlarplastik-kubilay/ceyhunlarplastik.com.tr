import { describe, expect, it } from "vitest"

import type { Category, CategoryTranslation } from "@/prisma/generated/prisma/client"

import { localizeCategory } from "./localizeCategory"

const now = new Date("2026-07-16T00:00:00.000Z")

const category: Category & { translations: CategoryTranslation[] } = {
    id: "category-1",
    code: 10,
    name: "Bakalit Tutamaklar",
    slug: "bakalit-tutamaklar",
    allowedAttributeValueIds: [],
    createdAt: now,
    updatedAt: now,
    translations: [
        {
            id: "translation-tr",
            categoryId: "category-1",
            locale: "tr",
            name: "Bakalit Tutamaklar",
            slug: "bakalit-tutamaklar",
            createdAt: now,
            updatedAt: now,
        },
    ],
}

describe("localizeCategory", () => {
    it("marks a missing requested translation and falls back to TR", () => {
        const localized = localizeCategory(category, "en")

        expect(localized.name).toBe("Bakalit Tutamaklar")
        expect(localized.slug).toBe("bakalit-tutamaklar")
        expect(localized.locale).toBe("en")
        expect(localized.resolvedLocale).toBe("tr")
        expect(localized.translationMissing).toBe(true)
    })

    it("uses the requested translation and exposes alternate slugs", () => {
        const localized = localizeCategory({
            ...category,
            translations: [
                ...category.translations,
                {
                    id: "translation-en",
                    categoryId: "category-1",
                    locale: "en",
                    name: "Bakelite Handles",
                    slug: "bakelite-handles",
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        }, "en")

        expect(localized.name).toBe("Bakelite Handles")
        expect(localized.slug).toBe("bakelite-handles")
        expect(localized.translationMissing).toBe(false)
        expect(localized.alternateSlugs).toEqual({
            tr: "bakalit-tutamaklar",
            en: "bakelite-handles",
        })
    })

    it("treats legacy Category fields as available Turkish content during migration", () => {
        const localized = localizeCategory({
            ...category,
            translations: [],
        }, "tr")

        expect(localized.name).toBe("Bakalit Tutamaklar")
        expect(localized.slug).toBe("bakalit-tutamaklar")
        expect(localized.resolvedLocale).toBe("tr")
        expect(localized.translationMissing).toBe(false)
    })
})
