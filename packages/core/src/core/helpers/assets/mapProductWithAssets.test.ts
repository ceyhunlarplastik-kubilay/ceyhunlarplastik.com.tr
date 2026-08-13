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
    it("localizes product fields and exposes slug metadata", () => {
        const mapped = mapProductWithAssets(makeProduct({
            description: "Türkçe açıklama",
            translations: [
                {
                    id: "product-tr",
                    productId: "product-1",
                    locale: "tr",
                    name: "Test Ürün",
                    slug: "test-urun",
                    description: "Türkçe açıklama",
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "product-en",
                    productId: "product-1",
                    locale: "en",
                    name: "Test Product",
                    slug: "test-product",
                    description: "English description",
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        }), "en")

        expect(mapped.name).toBe("Test Product")
        expect(mapped.slug).toBe("test-product")
        expect(mapped.description).toBe("English description")
        expect(mapped.resolvedLocale).toBe("en")
        expect(mapped.translationMissing).toBe(false)
        expect(mapped.alternateSlugs).toEqual({
            tr: "test-urun",
            en: "test-product",
        })
    })

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
                    translations: [
                        {
                            id: "usage-translation-tr",
                            productIndustrialUsageId: "industrial-usage-1",
                            locale: "tr",
                            usageFunction: "Kullanım açıklaması",
                            createdAt: now,
                            updatedAt: now,
                        },
                        {
                            id: "usage-translation-en",
                            productIndustrialUsageId: "industrial-usage-1",
                            locale: "en",
                            usageFunction: "Usage explanation",
                            createdAt: now,
                            updatedAt: now,
                        },
                    ],
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
        expect(industrialUsage.usageFunction).toBe("Usage explanation")
        expect(industrialUsage.translationMissing).toBe(false)
        expect(industrialUsage.usageAreaValue.translationMissing).toBe(false)
        expect(industrialUsage.usageAreaValue.translations).toBeUndefined()
    })

    /**
     * Public payload daralması. Prod ölçümü (224 kullanım satırlı ürün):
     * HTML 2374 KB'ın 1945 KB'ı (%82) `industrialUsages` dizisiydi; 1256 KB'ı
     * 14 dilin `translations` satırları, 384 KB'ı taksonomi `alternateSlugs`'ları.
     * Public sayfa ikisini de okumaz. Bu testler alanların sessizce geri
     * gelmesini engeller.
     */
    describe("includeAdminTranslations: false (public yüzey)", () => {
        function mapUsageProduct(options?: { includeAdminTranslations: boolean }) {
            const usageAreaAttribute = makeAttribute(
                "attribute-usage-area",
                "usage_area",
                "Kullanım Alanı",
                "Usage Area",
            )
            const usageArea = makeValue(
                "usage-area-1",
                usageAreaAttribute,
                "Duvar Rafları",
                "duvar-raflari",
                "Wall Shelves",
                "wall-shelves",
            )

            return mapProductWithAssets(
                makeProduct({
                    industrialUsages: [
                        {
                            id: "industrial-usage-1",
                            productId: "product-1",
                            sectorValueId: null,
                            sectorValue: null,
                            productionGroupValueId: null,
                            productionGroupValue: null,
                            usageAreaValueId: usageArea.id,
                            usageAreaValue: usageArea,
                            usageFunction: "Kullanım açıklaması",
                            translations: [
                                {
                                    id: "usage-translation-tr",
                                    productIndustrialUsageId: "industrial-usage-1",
                                    locale: "tr",
                                    usageFunction: "Kullanım açıklaması",
                                    createdAt: now,
                                    updatedAt: now,
                                },
                                {
                                    id: "usage-translation-en",
                                    productIndustrialUsageId: "industrial-usage-1",
                                    locale: "en",
                                    usageFunction: "Usage explanation",
                                    createdAt: now,
                                    updatedAt: now,
                                },
                            ],
                            imageKey: null,
                            displayOrder: 0,
                            createdAt: now,
                            updatedAt: now,
                        },
                    ],
                }),
                "en",
                options,
            )
        }

        it("varsayılan admin davranışını korur — çeviri satırları taşınır", () => {
            const [usage] = mapUsageProduct().industrialUsages

            expect(usage.translations).toHaveLength(2)
            expect(usage.usageAreaValue.alternateSlugs).toBeDefined()
        })

        it("public çağrıda kullanım satırı çevirilerini taşımaz", () => {
            const [usage] = mapUsageProduct({ includeAdminTranslations: false })
                .industrialUsages

            expect(usage.translations).toBeUndefined()
        })

        it("public çağrıda taksonomi alternateSlugs'ını taşımaz", () => {
            const [usage] = mapUsageProduct({ includeAdminTranslations: false })
                .industrialUsages

            expect(usage.usageAreaValue.alternateSlugs).toBeUndefined()
        })

        it("public çağrıda ürün çeviri satırlarını taşımaz", () => {
            const mapped = mapUsageProduct({ includeAdminTranslations: false })

            expect(mapped.translations).toBeUndefined()
        })

        it("SEO için gerekenleri KORUR: ürün alternateSlugs ve çözümlenmiş metin", () => {
            const mapped = mapUsageProduct({ includeAdminTranslations: false })
            const [usage] = mapped.industrialUsages

            // hreflang/canonical bunu okur — asla düşmemeli.
            expect(mapped.alternateSlugs).toBeDefined()
            // Tabloda render edilen metin ve taksonomi adı yerinde.
            expect(usage.usageFunction).toBe("Usage explanation")
            expect(usage.usageAreaValue.name).toBe("Wall Shelves")
        })
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
