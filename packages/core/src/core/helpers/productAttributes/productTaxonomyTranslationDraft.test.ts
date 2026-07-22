import { describe, expect, it, vi } from "vitest"

import {
    ProductTaxonomyTranslationDraftError,
    applyProductTaxonomyTranslationDraft,
    buildProductTaxonomyTranslationWrites,
    createProductTaxonomyTranslationDraft,
    type ProductTaxonomyTranslationDraftStore,
} from "./productTaxonomyTranslationDraft"

function createValueDraft(translatedNames = ["Furniture", "Furniture"]) {
    return createProductTaxonomyTranslationDraft({
        candidates: [
            {
                entity: "productAttributeValue",
                productAttributeValueId: "value-1",
                attributeId: "attribute-1",
                attributeCode: "sector",
                sourceName: "Mobilya",
            },
            {
                entity: "productAttributeValue",
                productAttributeValueId: "value-2",
                attributeId: "attribute-1",
                attributeCode: "sector",
                sourceName: "Mobilya Sektörü",
            },
        ],
        translatedNames,
        generatedAt: new Date("2026-07-20T12:00:00.000Z"),
        estimatedCharacters: 20,
        billedCharacters: 20,
    })
}

describe("product taxonomy translation drafts", () => {
    it("rejects duplicate target slugs within the same attribute", () => {
        const draft = createValueDraft()

        expect(() => buildProductTaxonomyTranslationWrites({
            draft,
            attributes: [],
            values: [
                {
                    id: "value-1",
                    attributeId: "attribute-1",
                    attribute: { code: "sector" },
                    translations: [{ locale: "tr", name: "Mobilya", slug: "mobilya" }],
                },
                {
                    id: "value-2",
                    attributeId: "attribute-1",
                    attribute: { code: "sector" },
                    translations: [{ locale: "tr", name: "Mobilya Sektörü", slug: "mobilya-sektoru" }],
                },
            ],
        })).toThrow(ProductTaxonomyTranslationDraftError)
    })

    it("rejects an apply when an existing target slug owner is found", async () => {
        const draft = createProductTaxonomyTranslationDraft({
            candidates: [{
                entity: "productAttributeValue",
                productAttributeValueId: "value-1",
                attributeId: "attribute-1",
                attributeCode: "sector",
                sourceName: "Mobilya",
            }],
            translatedNames: ["Furniture"],
            generatedAt: new Date("2026-07-20T12:00:00.000Z"),
            estimatedCharacters: 7,
            billedCharacters: 7,
        })
        const store: ProductTaxonomyTranslationDraftStore = {
            loadAttributes: vi.fn(async () => []),
            loadValues: vi.fn(async () => [{
                id: "value-1",
                attributeId: "attribute-1",
                attribute: { code: "sector" },
                translations: [{ locale: "tr", name: "Mobilya", slug: "mobilya" }],
            }]),
            findValueSlugOwners: vi.fn(async () => [{
                productAttributeValueId: "value-2",
                attributeId: "attribute-1",
                slug: "furniture",
            }]),
            createManyAtomically: vi.fn(),
        }

        await expect(applyProductTaxonomyTranslationDraft({ draft, store }))
            .rejects.toThrow(ProductTaxonomyTranslationDraftError)
        expect(store.createManyAtomically).not.toHaveBeenCalled()
    })
})
