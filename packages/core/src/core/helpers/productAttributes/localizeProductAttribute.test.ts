import { describe, expect, it } from "vitest"

import {
    localizeProductAttribute,
    localizeProductAttributeValue,
} from "./localizeProductAttribute"

const now = new Date("2026-07-20T12:00:00.000Z")

describe("localizeProductAttribute", () => {
    it("falls back to TR and marks a missing requested translation", () => {
        const localized = localizeProductAttribute({
            id: "attribute-id",
            code: "sector",
            name: "Sektör",
            displayOrder: 0,
            isActive: true,
            isCustomerAssignable: true,
            createdAt: now,
            updatedAt: now,
            translations: [{
                id: "tr-translation",
                productAttributeId: "attribute-id",
                locale: "tr",
                name: "Sektör",
                createdAt: now,
                updatedAt: now,
            }],
        }, "en")

        expect(localized.name).toBe("Sektör")
        expect(localized.resolvedLocale).toBe("tr")
        expect(localized.translationMissing).toBe(true)
    })
})

describe("localizeProductAttributeValue", () => {
    it("uses the requested translation and exposes alternate slugs", () => {
        const localized = localizeProductAttributeValue({
            id: "value-id",
            name: "Mobilya",
            slug: "mobilya",
            attributeId: "attribute-id",
            parentValueId: null,
            displayOrder: 0,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            translations: [
                {
                    id: "tr-translation",
                    productAttributeValueId: "value-id",
                    attributeId: "attribute-id",
                    locale: "tr",
                    name: "Mobilya",
                    slug: "mobilya",
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "en-translation",
                    productAttributeValueId: "value-id",
                    attributeId: "attribute-id",
                    locale: "en",
                    name: "Furniture",
                    slug: "furniture",
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        }, "en")

        expect(localized.name).toBe("Furniture")
        expect(localized.slug).toBe("furniture")
        expect(localized.translationMissing).toBe(false)
        expect(localized.alternateSlugs).toEqual({
            tr: "mobilya",
            en: "furniture",
        })
    })
})
