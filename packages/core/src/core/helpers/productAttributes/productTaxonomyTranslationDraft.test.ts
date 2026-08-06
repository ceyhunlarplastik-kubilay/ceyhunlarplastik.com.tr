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
        targetLocale: "en",
        candidates: [
            {
                entity: "productAttributeValue",
                productAttributeValueId: "value-1",
                attributeId: "attribute-1",
                attributeCode: "sector",
                sourceName: "Mobilya",
                defaultLocaleName: "Mobilya",
            },
            {
                entity: "productAttributeValue",
                productAttributeValueId: "value-2",
                attributeId: "attribute-1",
                attributeCode: "sector",
                sourceName: "Mobilya Sektörü",
                defaultLocaleName: "Mobilya Sektörü",
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

    describe("pivot çeviri (kaynak dil = en)", () => {
        function createPivotDraft(targetLocale: "de" | "ko") {
            return createProductTaxonomyTranslationDraft({
                targetLocale,
                sourceLocale: "en",
                candidates: [{
                    entity: "productAttributeValue",
                    productAttributeValueId: "value-1",
                    attributeId: "attribute-1",
                    attributeCode: "sector",
                    // Çeviri EN'den yapılıyor…
                    sourceName: "Furniture",
                    // …ama slug fallback'i hâlâ TR adına dayanıyor.
                    defaultLocaleName: "Mobilya",
                }],
                translatedNames: [targetLocale === "de" ? "Möbel" : "가구"],
                estimatedCharacters: 9,
                billedCharacters: 9,
            })
        }

        it("kaynak dili taslak başlığına yazar", () => {
            const draft = createPivotDraft("de")

            expect(draft.sourceLocale).toBe("en")
            expect(draft.entries[0].source.name).toBe("Furniture")
        })

        it("parmak izi kaynak dile bağlı — tr ve en aynı metin için farklı üretir", () => {
            // Apply, parmak izini kaynak satırla karşılaştırıyor. Kaynak dil
            // parmak izine girmeseydi, en'den üretilmiş bir taslak tr satırıyla
            // eşleşmiş görünürdü.
            const pivot = createPivotDraft("de")
            const fromTurkish = createProductTaxonomyTranslationDraft({
                targetLocale: "de",
                candidates: [{
                    entity: "productAttributeValue",
                    productAttributeValueId: "value-1",
                    attributeId: "attribute-1",
                    attributeCode: "sector",
                    sourceName: "Furniture",
                    defaultLocaleName: "Mobilya",
                }],
                translatedNames: ["Möbel"],
                estimatedCharacters: 9,
                billedCharacters: 9,
            })

            expect(pivot.entries[0].source.fingerprint)
                .not.toBe(fromTurkish.entries[0].source.fingerprint)
        })

        it("slug üretilemeyen hedeflerde TR adına düşer, EN adına DEĞİL", () => {
            // Asıl tuzak bu: fallback DEFAULT_LOCALE'e bakıyor, "kaynak dile"
            // değil. Pivot en olunca TR adı ayrıca taşınmasaydı ko/ja/zh/hi
            // "slug could not be generated" ile patlardı.
            const draft = createPivotDraft("ko")

            expect(draft.entries[0].target).toEqual({
                name: "가구",
                slug: "mobilya",
            })
        })
    })

    it("rejects an apply when an existing target slug owner is found", async () => {
        const draft = createProductTaxonomyTranslationDraft({
            targetLocale: "en",
            candidates: [{
                entity: "productAttributeValue",
                productAttributeValueId: "value-1",
                attributeId: "attribute-1",
                attributeCode: "sector",
                sourceName: "Mobilya",
                defaultLocaleName: "Mobilya",
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
