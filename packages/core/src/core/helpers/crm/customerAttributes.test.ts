import { describe, expect, test } from "vitest"
import { resolveCustomerAttributeAssignments } from "./customerAttributes"
import type { IPrismaProductAttributeValueRepository, ProductAttributeValueWithAttribute } from "../prisma/productAttributeValues/repository"

function createRepository(values: Record<string, ProductAttributeValueWithAttribute | null>): IPrismaProductAttributeValueRepository {
    return {
        listValues: async () => [],
        getValueById: async (id: string) => values[id] ?? null,
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

function makeValue(
    id: string,
    attributeCode: string,
    options: Partial<ProductAttributeValueWithAttribute> = {},
): ProductAttributeValueWithAttribute {
    const attribute = options.attribute ?? {
        id: `${attributeCode}-attribute`,
        code: attributeCode,
        name: attributeCode,
        displayOrder: 0,
        isActive: true,
        isCustomerAssignable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    return {
        id,
        name: options.name ?? id,
        slug: options.slug ?? id,
        attributeId: options.attributeId ?? attribute.id,
        parentValueId: options.parentValueId ?? null,
        displayOrder: options.displayOrder ?? 0,
        isActive: options.isActive ?? true,
        createdAt: options.createdAt ?? new Date(),
        updatedAt: options.updatedAt ?? new Date(),
        assets: options.assets ?? [],
        attribute,
        parentValue: options.parentValue ?? null,
    }
}

describe("resolveCustomerAttributeAssignments", () => {
    test("accepts future customer-assignable attributes without hierarchy rules", async () => {
        const repo = createRepository({
            usageFunctionA: makeValue("usageFunctionA", "usage_function"),
            usageFunctionB: makeValue("usageFunctionB", "usage_function"),
        })

        const result = await resolveCustomerAttributeAssignments(repo, {
            attributeValueIds: ["usageFunctionA", "usageFunctionB"],
        })

        expect(result).toMatchObject({
            source: "MANUAL",
            assignmentValueIds: ["usageFunctionA", "usageFunctionB"],
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaIds: [],
        })
    })

    test("rejects non-customer-assignable future attributes", async () => {
        const repo = createRepository({
            hidden: makeValue("hidden", "usage_function", {
                attribute: {
                    id: "usage-function-attribute",
                    code: "usage_function",
                    name: "usage_function",
                    displayOrder: 0,
                    isActive: true,
                    isCustomerAssignable: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }),
        })

        await expect(resolveCustomerAttributeAssignments(repo, {
            attributeValueIds: ["hidden"],
        })).rejects.toThrow("customer profile selection is not allowed")
    })

    test("derives hierarchy legacy fields from generic assignment ids", async () => {
        const sector = makeValue("sector-a", "sector", {
            attribute: {
                id: "sector-attribute",
                code: "sector",
                name: "sector",
                displayOrder: 0,
                isActive: true,
                isCustomerAssignable: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        })
        const productionGroup = makeValue("pg-a", "production_group", {
            parentValueId: sector.id,
            parentValue: sector,
            attribute: {
                id: "production-group-attribute",
                code: "production_group",
                name: "production_group",
                displayOrder: 0,
                isActive: true,
                isCustomerAssignable: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        })
        const usageArea = makeValue("ua-a", "usage_area", {
            parentValueId: productionGroup.id,
            parentValue: {
                ...productionGroup,
                parentValue: sector,
            },
            attribute: {
                id: "usage-area-attribute",
                code: "usage_area",
                name: "usage_area",
                displayOrder: 0,
                isActive: true,
                isCustomerAssignable: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        })

        const repo = createRepository({
            [sector.id]: sector,
            [productionGroup.id]: productionGroup,
            [usageArea.id]: usageArea,
        })

        const result = await resolveCustomerAttributeAssignments(repo, {
            attributeValueIds: [sector.id, productionGroup.id, usageArea.id],
        })

        expect(result).toMatchObject({
            assignmentValueIds: [sector.id, productionGroup.id, usageArea.id],
            sectorValueId: sector.id,
            productionGroupValueId: productionGroup.id,
            usageAreaIds: [usageArea.id],
        })
    })
})
