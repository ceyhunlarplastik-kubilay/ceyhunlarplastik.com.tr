import { describe, expect, it } from "vitest"

import {
    ProductIndustrialUsageTranslationDraftError,
    buildProductIndustrialUsageTranslationWrites,
    createProductIndustrialUsageTranslationDraft,
} from "./productIndustrialUsageTranslationDraft"

describe("productIndustrialUsageTranslationDraft", () => {
    const candidate = {
        productIndustrialUsageId: "usage-1",
        productId: "product-1",
        productCode: "10.11",
        sourceUsageFunction: "Türkçe kullanım açıklaması",
    }

    it("builds writes for reviewed drafts when source fingerprint is current", () => {
        const draft = createProductIndustrialUsageTranslationDraft({
            candidates: [candidate],
            translatedUsageFunctions: ["English usage explanation"],
            estimatedCharacters: 24,
            billedCharacters: 24,
        })

        expect(buildProductIndustrialUsageTranslationWrites({
            draft,
            usages: [{
                id: "usage-1",
                productId: "product-1",
                product: { code: "10.11" },
                translations: [{
                    locale: "tr",
                    usageFunction: "Türkçe kullanım açıklaması",
                }],
            }],
        })).toEqual([{
            productIndustrialUsageId: "usage-1",
            locale: "en",
            usageFunction: "English usage explanation",
        }])
    })

    it("rejects stale source fingerprints", () => {
        const draft = createProductIndustrialUsageTranslationDraft({
            candidates: [candidate],
            translatedUsageFunctions: ["English usage explanation"],
            estimatedCharacters: 24,
            billedCharacters: 24,
        })

        expect(() => buildProductIndustrialUsageTranslationWrites({
            draft,
            usages: [{
                id: "usage-1",
                productId: "product-1",
                product: { code: "10.11" },
                translations: [{
                    locale: "tr",
                    usageFunction: "Değişmiş kaynak",
                }],
            }],
        })).toThrow(ProductIndustrialUsageTranslationDraftError)
    })

    it("does not create writes over existing target translations", () => {
        const draft = createProductIndustrialUsageTranslationDraft({
            candidates: [candidate],
            translatedUsageFunctions: ["English usage explanation"],
            estimatedCharacters: 24,
            billedCharacters: 24,
        })

        expect(() => buildProductIndustrialUsageTranslationWrites({
            draft,
            usages: [{
                id: "usage-1",
                productId: "product-1",
                product: { code: "10.11" },
                translations: [
                    {
                        locale: "tr",
                        usageFunction: "Türkçe kullanım açıklaması",
                    },
                    {
                        locale: "en",
                        usageFunction: "Existing English explanation",
                    },
                ],
            }],
        })).toThrow(ProductIndustrialUsageTranslationDraftError)
    })
})
