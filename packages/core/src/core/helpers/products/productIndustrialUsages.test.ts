import { describe, expect, it } from "vitest"
import {
    assertNoIndustrialAttributeValues,
    buildProductIndustrialUsageUpdateInput,
    normalizeProductIndustrialUsages,
} from "./productIndustrialUsages"
import type { IPrismaProductAttributeValueRepository } from "../prisma/productAttributeValues/repository"

function makeValue(id: string, code: string, options: { isActive?: boolean; attributeActive?: boolean } = {}) {
    return {
        id,
        name: id,
        slug: id,
        attributeId: `${code}-attribute`,
        parentValueId: null,
        displayOrder: 0,
        isActive: options.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        assets: [],
        attribute: {
            id: `${code}-attribute`,
            code,
            name: code,
            displayOrder: 0,
            isActive: options.attributeActive ?? true,
            isCustomerAssignable: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        parentValue: null,
    }
}

function makeRepository(values: Record<string, ReturnType<typeof makeValue>>): IPrismaProductAttributeValueRepository {
    return {
        listValues: async () => [],
        getValueById: async (id: string) => values[id] as any,
        createValue: async () => {
            throw new Error("not implemented")
        },
        updateValue: async () => {
            throw new Error("not implemented")
        },
        deleteValue: async () => {
            throw new Error("not implemented")
        },
        getDeleteBlockers: async () => {
            throw new Error("not implemented")
        },
    }
}

describe("productIndustrialUsages", () => {
    it("rejects industrial taxonomy values in normal product attribute selections", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
            modelA: makeValue("modelA", "model_type"),
        })

        await expect(assertNoIndustrialAttributeValues(repository, ["modelA", "sectorA"])).rejects.toMatchObject({
            statusCode: 400,
        })
    })

    it("allows non-industrial product filter values in normal product attribute selections", async () => {
        const repository = makeRepository({
            modelA: makeValue("modelA", "model_type"),
        })

        await expect(assertNoIndustrialAttributeValues(repository, ["modelA"])).resolves.toBeUndefined()
    })

    it("normalizes industrial usage rows with code-based validation", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
            groupA: makeValue("groupA", "production_group"),
            areaA: makeValue("areaA", "usage_area"),
        })

        await expect(
            normalizeProductIndustrialUsages(repository, [
                {
                    sectorValueId: "sectorA",
                    productionGroupValueId: "groupA",
                    usageAreaValueId: "areaA",
                    usageFunction: "  Tasiyici ayak cozumudur.  ",
                    imageKey: "  products/sample/industrial-usages/example.jpg  ",
                    displayOrder: 5,
                },
            ]),
        ).resolves.toEqual([
            {
                id: null,
                sectorValueId: "sectorA",
                productionGroupValueId: "groupA",
                usageAreaValueId: "areaA",
                usageFunction: "Tasiyici ayak cozumudur.",
                translations: [
                    {
                        locale: "tr",
                        usageFunction: "Tasiyici ayak cozumudur.",
                    },
                ],
                createOnlyTranslations: [],
                imageKey: "products/sample/industrial-usages/example.jpg",
                displayOrder: 5,
            },
        ])
    })

    it("normalizes optional target-locale usage translations without overwriting source", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
        })

        const rows = await normalizeProductIndustrialUsages(repository, [
            {
                id: "usage-1",
                sectorValueId: "sectorA",
                usageFunction: "Türkçe açıklama",
                translations: [
                    {
                        locale: "tr",
                        usageFunction: "Yok sayılır",
                    },
                    {
                        locale: "en",
                        usageFunction: "English explanation",
                    },
                ],
            },
        ])

        expect(rows[0]).toMatchObject({
            id: "usage-1",
            usageFunction: "Türkçe açıklama",
            translations: [
                {
                    locale: "tr",
                    usageFunction: "Türkçe açıklama",
                },
                {
                    locale: "en",
                    usageFunction: "English explanation",
                },
            ],
        })

        expect(buildProductIndustrialUsageUpdateInput(rows[0]).translations).toMatchObject({
            upsert: [
                {
                    where: {
                        productIndustrialUsageId_locale: {
                            productIndustrialUsageId: "usage-1",
                            locale: "tr",
                        },
                    },
                    update: {
                        usageFunction: "Türkçe açıklama",
                    },
                },
                {
                    where: {
                        productIndustrialUsageId_locale: {
                            productIndustrialUsageId: "usage-1",
                            locale: "en",
                        },
                    },
                    update: {
                        usageFunction: "English explanation",
                    },
                },
            ],
        })
    })

    it("rejects a wrong dictionary code in an industrial usage field", async () => {
        const repository = makeRepository({
            modelA: makeValue("modelA", "model_type"),
        })

        await expect(
            normalizeProductIndustrialUsages(repository, [
                {
                    sectorValueId: "modelA",
                },
            ]),
        ).rejects.toMatchObject({
            statusCode: 400,
        })
    })

    it("rejects rows that only contain an image without taxonomy values", async () => {
        const repository = makeRepository({})

        await expect(
            normalizeProductIndustrialUsages(repository, [
                {
                    imageKey: "products/sample/industrial-usages/example.jpg",
                },
            ]),
        ).rejects.toMatchObject({
            statusCode: 400,
        })
    })
})
