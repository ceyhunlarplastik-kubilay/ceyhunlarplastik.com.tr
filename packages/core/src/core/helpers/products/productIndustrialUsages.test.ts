import { describe, expect, it } from "vitest"
import {
    assertNoIndustrialAttributeValues,
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
                sectorValueId: "sectorA",
                productionGroupValueId: "groupA",
                usageAreaValueId: "areaA",
                usageFunction: "Tasiyici ayak cozumudur.",
                imageKey: "products/sample/industrial-usages/example.jpg",
                displayOrder: 5,
            },
        ])
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
