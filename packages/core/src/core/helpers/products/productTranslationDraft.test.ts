import { describe, expect, it, vi } from "vitest"

import {
    applyProductTranslationDraft,
    buildProductTranslationWrites,
    createProductTranslationDraft,
    type ProductTranslationDraftStore,
    type ProductTranslationState,
} from "./productTranslationDraft"

function createDraft(
    products: Array<{
        id: string
        code: string
        sourceName: string
        sourceSlug: string
        sourceDescription: string | null
    }> = [{
        id: "product-1",
        code: "10.11",
        sourceName: "Bakalit Tutamak",
        sourceSlug: "bakalit-tutamak",
        sourceDescription: "Türkçe açıklama",
    }],
    translatedProducts: Array<{
        name: string
        description: string | null
    }> = [{
        name: "Bakelite Handle",
        description: "English description",
    }],
) {
    return createProductTranslationDraft({
        products,
        translatedProducts,
        generatedAt: new Date("2026-07-25T00:00:00.000Z"),
        estimatedCharacters: 32,
        billedCharacters: 32,
    })
}

function createProductState({
    id = "product-1",
    code = "10.11",
    sourceName = "Bakalit Tutamak",
    sourceSlug = "bakalit-tutamak",
    sourceDescription = "Türkçe açıklama",
    includeEnglish = false,
}: {
    id?: string
    code?: string
    sourceName?: string
    sourceSlug?: string
    sourceDescription?: string | null
    includeEnglish?: boolean
} = {}): ProductTranslationState {
    return {
        id,
        code,
        translations: [
            {
                locale: "tr",
                name: sourceName,
                slug: sourceSlug,
                description: sourceDescription,
            },
            ...(includeEnglish ? [{
                locale: "en",
                name: "Manual English",
                slug: "manual-english",
                description: null,
            }] : []),
        ],
    }
}

describe("productTranslationDraft", () => {
    it("builds writes for reviewed drafts when source fingerprint is current", () => {
        const draft = createDraft()

        expect(buildProductTranslationWrites(draft, [createProductState()])).toEqual([{
            productId: "product-1",
            locale: "en",
            name: "Bakelite Handle",
            slug: "bakelite-handle",
            description: "English description",
        }])
    })

    it("rejects stale source fingerprints", () => {
        const draft = createDraft()

        expect(() => buildProductTranslationWrites(draft, [
            createProductState({ sourceDescription: "Değişmiş açıklama" }),
        ])).toThrow("source translation changed")
    })

    it("does not create writes over existing target translations", () => {
        const draft = createDraft()

        expect(() => buildProductTranslationWrites(draft, [
            createProductState({ includeEnglish: true }),
        ])).toThrow("already has an en translation")
    })

    it("rejects duplicate normalized slugs within the draft", () => {
        const draft = createDraft([
            {
                id: "product-1",
                code: "10.11",
                sourceName: "Birinci",
                sourceSlug: "birinci",
                sourceDescription: null,
            },
            {
                id: "product-2",
                code: "10.12",
                sourceName: "İkinci",
                sourceSlug: "ikinci",
                sourceDescription: null,
            },
        ], [
            { name: "Same Name", description: null },
            { name: "Same Name", description: null },
        ])

        expect(() => buildProductTranslationWrites(draft, [
            createProductState({
                id: "product-1",
                code: "10.11",
                sourceName: "Birinci",
                sourceSlug: "birinci",
                sourceDescription: null,
            }),
            createProductState({
                id: "product-2",
                code: "10.12",
                sourceName: "İkinci",
                sourceSlug: "ikinci",
                sourceDescription: null,
            }),
        ])).toThrow("is duplicated")
    })

    it("does not call the atomic writer when a DB slug conflict exists", async () => {
        const draft = createDraft()
        const createManyAtomically = vi.fn()
        const store: ProductTranslationDraftStore = {
            loadProducts: vi.fn().mockResolvedValue([createProductState()]),
            findSlugOwners: vi.fn().mockResolvedValue([{
                productId: "another-product",
                slug: "bakelite-handle",
            }]),
            createManyAtomically,
        }

        await expect(applyProductTranslationDraft({ draft, store }))
            .rejects.toThrow("already used")
        expect(createManyAtomically).not.toHaveBeenCalled()
    })
})
