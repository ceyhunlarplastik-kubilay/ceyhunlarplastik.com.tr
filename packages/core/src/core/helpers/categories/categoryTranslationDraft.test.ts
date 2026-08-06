import { describe, expect, it, vi } from "vitest"

import {
    applyCategoryTranslationDraft,
    buildCategoryTranslationWrites,
    createCategoryTranslationDraft,
    type CategoryTranslationDraftStore,
    type CategoryTranslationState,
} from "./categoryTranslationDraft"

function createDraft(
    categories = [{ id: "category-1", code: 10, sourceName: "Bakalit Tutamaklar" }],
    translatedNames = ["Bakelite Handles"],
) {
    return createCategoryTranslationDraft({
        targetLocale: "en",
        categories,
        translatedNames,
        generatedAt: new Date("2026-07-17T00:00:00.000Z"),
        estimatedCharacters: categories.reduce(
            (total, category) => total + Array.from(category.sourceName).length,
            0,
        ),
        billedCharacters: categories.reduce(
            (total, category) => total + Array.from(category.sourceName).length,
            0,
        ),
    })
}

function createCategoryState({
    id = "category-1",
    code = 10,
    sourceName = "Bakalit Tutamaklar",
    includeEnglish = false,
}: {
    id?: string
    code?: number
    sourceName?: string
    includeEnglish?: boolean
} = {}): CategoryTranslationState {
    return {
        id,
        code,
        translations: [
            {
                locale: "tr",
                name: sourceName,
                slug: "bakalit-tutamaklar",
            },
            ...(includeEnglish ? [{
                locale: "en",
                name: "Manual English",
                slug: "manual-english",
            }] : []),
        ],
    }
}

describe("Category translation drafts", () => {
    it("creates a reviewable draft and canonical EN slug", () => {
        const draft = createDraft()

        expect(draft.entries[0]).toMatchObject({
            categoryId: "category-1",
            categoryCode: 10,
            source: { name: "Bakalit Tutamaklar" },
            target: {
                name: "Bakelite Handles",
                slug: "bakelite-handles",
            },
        })
        expect(draft.entries[0].source.fingerprint).toMatch(/^[a-f0-9]{64}$/)
    })

    /**
     * Bu yol dokuz dil (en/de/fr/es/it/pt/pl/ru/ar) boyunca HİÇ çalışmadı: hepsinde
     * slugify dolu bir slug üretti. ko/ja/zh/hi'de boş dönüyor ve draft üreticisi
     * normalizer'ı yalnız hedef dille çağırdığı için fallback'in dayanacağı TR
     * slug'ı yoktu — "slug could not be generated" ile patlıyordu.
     */
    it.each(["ko", "ja", "zh", "hi"] as const)(
        "%s gibi slugify'ın boş döndüğü dillerde TR slug'ına düşer",
        (targetLocale) => {
            const draft = createCategoryTranslationDraft({
                targetLocale,
                categories: [{ id: "category-1", code: 10, sourceName: "Bakalit Tutamaklar" }],
                translatedNames: ["바칼라이트 손잡이"],
                generatedAt: new Date("2026-08-04T00:00:00.000Z"),
                estimatedCharacters: 18,
                billedCharacters: 18,
            })

            expect(draft.entries[0].target).toEqual({
                name: "바칼라이트 손잡이",
                // TR adından türeyen slug; `@@unique([locale, slug])` locale başına
                // olduğu için TR satırıyla çakışmaz.
                slug: "bakalit-tutamaklar",
            })
        },
    )

    it("slug üretilebilen dillerde TR slug'ı sızdırmaz", () => {
        // Kaynak satırı normalizer'a vermek fallback için şart, ama hedef dilin
        // KENDİ slug'ı üretilebiliyorsa o kullanılmalı — TR'ye düşülmemeli.
        const draft = createDraft(
            [{ id: "category-1", code: 10, sourceName: "Bakalit Tutamaklar" }],
            ["Bakelite Handles"],
        )

        expect(draft.entries[0].target.slug).toBe("bakelite-handles")
    })

    it("rejects a stale draft when the TR source changed", () => {
        const draft = createDraft()

        expect(() => buildCategoryTranslationWrites(draft, [
            createCategoryState({ sourceName: "Changed Turkish Name" }),
        ])).toThrow("source translation changed")
    })

    it("never overwrites an existing manual EN translation", () => {
        const draft = createDraft()

        expect(() => buildCategoryTranslationWrites(draft, [
            createCategoryState({ includeEnglish: true }),
        ])).toThrow("already has an en translation")
    })

    it("rejects duplicate normalized slugs within the draft", () => {
        const draft = createDraft([
            { id: "category-1", code: 10, sourceName: "Birinci" },
            { id: "category-2", code: 20, sourceName: "Ikinci" },
        ], ["Same Name", "Same Name"])

        expect(() => buildCategoryTranslationWrites(draft, [
            createCategoryState({ id: "category-1", code: 10, sourceName: "Birinci" }),
            createCategoryState({ id: "category-2", code: 20, sourceName: "Ikinci" }),
        ])).toThrow("is duplicated")
    })

    it("does not call the atomic writer when a DB slug conflict exists", async () => {
        const draft = createDraft()
        const createManyAtomically = vi.fn()
        const store: CategoryTranslationDraftStore = {
            loadCategories: vi.fn().mockResolvedValue([createCategoryState()]),
            findSlugOwners: vi.fn().mockResolvedValue([{
                categoryId: "another-category",
                slug: "bakelite-handles",
            }]),
            createManyAtomically,
        }

        await expect(applyCategoryTranslationDraft({ draft, store }))
            .rejects.toThrow("already used")
        expect(createManyAtomically).not.toHaveBeenCalled()
    })

    it("propagates an atomic write failure without reporting success", async () => {
        const draft = createDraft()
        const store: CategoryTranslationDraftStore = {
            loadCategories: vi.fn().mockResolvedValue([createCategoryState()]),
            findSlugOwners: vi.fn().mockResolvedValue([]),
            createManyAtomically: vi.fn().mockRejectedValue(new Error("Unique constraint failed")),
        }

        await expect(applyCategoryTranslationDraft({ draft, store }))
            .rejects.toThrow("Unique constraint failed")
    })

    it("returns the exact writes after an atomic apply", async () => {
        const draft = createDraft()
        const store: CategoryTranslationDraftStore = {
            loadCategories: vi.fn().mockResolvedValue([createCategoryState()]),
            findSlugOwners: vi.fn().mockResolvedValue([]),
            createManyAtomically: vi.fn().mockResolvedValue(1),
        }

        const result = await applyCategoryTranslationDraft({ draft, store })

        expect(result.created).toBe(1)
        expect(result.writes).toEqual([{
            categoryId: "category-1",
            locale: "en",
            name: "Bakelite Handles",
            slug: "bakelite-handles",
        }])
    })
})
