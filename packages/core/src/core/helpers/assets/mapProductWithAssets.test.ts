import { describe, expect, it } from "vitest"

import { mapProductWithAssets } from "./mapProductWithAssets"

const now = new Date("2026-07-22T00:00:00.000Z")

function makeAttribute(id: string, code: string, trName: string, enName: string) {
    return {
        id,
        code,
        name: trName,
        displayOrder: 0,
        isActive: true,
        isCustomerAssignable: true,
        createdAt: now,
        updatedAt: now,
        translations: [
            {
                id: `${id}-tr`,
                productAttributeId: id,
                locale: "tr",
                name: trName,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: `${id}-en`,
                productAttributeId: id,
                locale: "en",
                name: enName,
                createdAt: now,
                updatedAt: now,
            },
        ],
    }
}

function makeValue(
    id: string,
    attribute: ReturnType<typeof makeAttribute>,
    trName: string,
    trSlug: string,
    enName: string,
    enSlug: string,
) {
    return {
        id,
        name: trName,
        slug: trSlug,
        attributeId: attribute.id,
        parentValueId: null,
        displayOrder: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        attribute,
        translations: [
            {
                id: `${id}-tr`,
                productAttributeValueId: id,
                attributeId: attribute.id,
                locale: "tr",
                name: trName,
                slug: trSlug,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: `${id}-en`,
                productAttributeValueId: id,
                attributeId: attribute.id,
                locale: "en",
                name: enName,
                slug: enSlug,
                createdAt: now,
                updatedAt: now,
            },
        ],
    }
}

function makeProduct(overrides: Record<string, unknown> = {}) {
    return {
        id: "product-1",
        code: "P-1",
        name: "Test Ürün",
        slug: "test-urun",
        description: null,
        categoryId: null,
        category: null,
        assets: [],
        attributeValues: [],
        industrialUsages: [],
        createdAt: now,
        updatedAt: now,
        ...overrides,
    }
}

describe("mapProductWithAssets", () => {
    it("localizes industrial usage taxonomy values for public product detail", () => {
        const sectorAttribute = makeAttribute("attribute-sector", "sector", "Sektör", "Sector")
        const productionGroupAttribute = makeAttribute(
            "attribute-production-group",
            "production_group",
            "Üretim Grubu",
            "Production Group",
        )
        const usageAreaAttribute = makeAttribute(
            "attribute-usage-area",
            "usage_area",
            "Kullanım Alanı",
            "Usage Area",
        )
        const sector = makeValue(
            "sector-1",
            sectorAttribute,
            "Endüstriyel Makine",
            "endustriyel-makine",
            "Industrial Machinery",
            "industrial-machinery",
        )
        const productionGroup = makeValue(
            "production-group-1",
            productionGroupAttribute,
            "Üretim Hatları",
            "uretim-hatlari",
            "Production Lines",
            "production-lines",
        )
        const usageArea = makeValue(
            "usage-area-1",
            usageAreaAttribute,
            "Duvar Rafları",
            "duvar-raflari",
            "Wall Shelves",
            "wall-shelves",
        )

        const mapped = mapProductWithAssets(makeProduct({
            industrialUsages: [
                {
                    id: "industrial-usage-1",
                    productId: "product-1",
                    sectorValueId: sector.id,
                    sectorValue: sector,
                    productionGroupValueId: productionGroup.id,
                    productionGroupValue: productionGroup,
                    usageAreaValueId: usageArea.id,
                    usageAreaValue: usageArea,
                    usageFunction: "Kullanım açıklaması",
                    imageKey: null,
                    displayOrder: 0,
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        }), "en")

        const [industrialUsage] = mapped.industrialUsages

        expect(industrialUsage.sectorValue.name).toBe("Industrial Machinery")
        expect(industrialUsage.productionGroupValue.name).toBe("Production Lines")
        expect(industrialUsage.usageAreaValue.name).toBe("Wall Shelves")
        expect(industrialUsage.usageAreaValue.slug).toBe("wall-shelves")
        expect(industrialUsage.usageAreaValue.attribute.name).toBe("Usage Area")
        expect(industrialUsage.usageAreaValue.attribute).toEqual({
            id: usageAreaAttribute.id,
            code: "usage_area",
            name: "Usage Area",
        })
        expect(industrialUsage.usageAreaValue.translationMissing).toBe(false)
        expect(industrialUsage.usageAreaValue.translations).toBeUndefined()
    })

    it("localizes regular product attribute values used by badges", () => {
        const modelTypeAttribute = makeAttribute(
            "attribute-model-type",
            "model_type",
            "Model Tipi",
            "Model Type",
        )
        const modelTypeValue = makeValue(
            "model-type-1",
            modelTypeAttribute,
            "Standart",
            "standart",
            "Standard",
            "standard",
        )

        const mapped = mapProductWithAssets(makeProduct({
            attributeValues: [modelTypeValue],
        }), "en")

        expect(mapped.attributeValues).toHaveLength(1)
        expect(mapped.attributeValues[0].name).toBe("Standard")
        expect(mapped.attributeValues[0].slug).toBe("standard")
        expect(mapped.attributeValues[0].attribute.name).toBe("Model Type")
        expect(mapped.attributeValues[0].translations).toBeUndefined()
    })
})
