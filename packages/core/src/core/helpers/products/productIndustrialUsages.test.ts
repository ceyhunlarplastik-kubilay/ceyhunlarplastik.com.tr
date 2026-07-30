import { describe, expect, it } from "vitest"
import {
    assertAttributeValuesAllowedForCategory,
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

/** Toplu doğrulama sorgusunun kaç kez çağrıldığını sayar. */
function makeCountingRepository(values: Record<string, ReturnType<typeof makeValue>>) {
    const calls: string[][] = []
    const repository = makeRepository(values)
    const original = repository.getValuesForValidation

    return {
        repository: {
            ...repository,
            getValuesForValidation: async (ids: string[]) => {
                calls.push(ids)
                return original(ids)
            },
        } satisfies IPrismaProductAttributeValueRepository,
        calls,
    }
}

function makeRepository(values: Record<string, ReturnType<typeof makeValue>>): IPrismaProductAttributeValueRepository {
    return {
        listValues: async () => [],
        getValueById: async (id: string) => values[id] as any,
        getValuesForValidation: async (ids: string[]) =>
            ids
                .map((id) => values[id])
                .filter(Boolean)
                .map((value) => ({
                    id: value.id,
                    isActive: value.isActive,
                    parentValueId: value.parentValueId,
                    attribute: {
                        id: value.attribute.id,
                        code: value.attribute.code,
                        isActive: value.attribute.isActive,
                    },
                    parentValue: null,
                })),
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
                        // TR satırı görsel taşımaz: varsayılan görsel base imageKey'de durur.
                        imageKey: null,
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

    it("keeps a target-locale row that only carries an image", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
        })

        const rows = await normalizeProductIndustrialUsages(repository, [
            {
                id: "usage-1",
                sectorValueId: "sectorA",
                usageFunction: "Türkçe açıklama",
                imageKey: "default.jpg",
                translations: [
                    { locale: "en", imageKey: "  en/usage.png  " },
                ],
            },
        ])

        expect(rows[0].translations).toEqual([
            { locale: "tr", usageFunction: "Türkçe açıklama", imageKey: null },
            { locale: "en", usageFunction: null, imageKey: "en/usage.png" },
        ])
    })

    it("requires source text only for translated text, not for a translated image", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
        })

        // Kaynak metin yokken EN görseli kabul edilir...
        await expect(
            normalizeProductIndustrialUsages(repository, [
                {
                    sectorValueId: "sectorA",
                    translations: [{ locale: "en", imageKey: "en/usage.png" }],
                },
            ]),
        ).resolves.toMatchObject([
            { translations: [{ locale: "en", usageFunction: null, imageKey: "en/usage.png" }] },
        ])

        // ...ama EN metni kaynak metin olmadan reddedilir.
        await expect(
            normalizeProductIndustrialUsages(repository, [
                {
                    sectorValueId: "sectorA",
                    translations: [{ locale: "en", usageFunction: "English explanation" }],
                },
            ]),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("deletes translation rows whose locale disappeared from the payload", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
        })

        // EN metni ve görseli boşaltılmış: EN satırı silinmeli.
        // (Eskiden yalnız TR silinebiliyordu, EN kalıcı oluyordu.)
        const rows = await normalizeProductIndustrialUsages(repository, [
            {
                id: "usage-1",
                sectorValueId: "sectorA",
                usageFunction: "Türkçe açıklama",
                translations: [{ locale: "en", usageFunction: "   ", imageKey: null }],
            },
        ])

        expect(buildProductIndustrialUsageUpdateInput(rows[0]).translations).toMatchObject({
            deleteMany: { locale: { in: ["en"] } },
        })
    })

    it("deletes every translation row when the source text is cleared", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
        })

        const rows = await normalizeProductIndustrialUsages(repository, [
            {
                id: "usage-1",
                sectorValueId: "sectorA",
                usageFunction: null,
                imageKey: "default.jpg",
            },
        ])

        expect(buildProductIndustrialUsageUpdateInput(rows[0]).translations).toMatchObject({
            deleteMany: { locale: { in: ["tr", "en"] } },
        })
    })

    it("validates every row's taxonomy with a single batched query", async () => {
        // Regresyon koruması: eskiden satır başına 3 ardışık getValueById vardı.
        const { repository, calls } = makeCountingRepository({
            sectorA: makeValue("sectorA", "sector"),
            groupA: makeValue("groupA", "production_group"),
            areaA: makeValue("areaA", "usage_area"),
        })

        const rows = Array.from({ length: 25 }, () => ({
            sectorValueId: "sectorA",
            productionGroupValueId: "groupA",
            usageAreaValueId: "areaA",
        }))

        await expect(normalizeProductIndustrialUsages(repository, rows)).resolves.toHaveLength(25)

        expect(calls).toHaveLength(1)
        // Tekrarlayan ID'ler tek sefer sorulur.
        expect([...calls[0]].sort()).toEqual(["areaA", "groupA", "sectorA"])
    })

    it("reports the first offending row, preserving pre-batching error order", async () => {
        const repository = makeRepository({
            sectorA: makeValue("sectorA", "sector"),
            groupA: makeValue("groupA", "production_group"),
        })

        await expect(
            normalizeProductIndustrialUsages(repository, [
                { sectorValueId: "sectorA" },
                // sector alanına production_group değeri → bu satır patlamalı
                { sectorValueId: "groupA" },
            ]),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "sectorValueId must reference a sector attribute value",
        })
    })
})

describe("assertAttributeValuesAllowedForCategory", () => {
    it("accepts a value whose parent chain is allowlisted", async () => {
        const child = makeValue("childA", "usage_area")
        const { repository, calls } = makeCountingRepository({ childA: child })

        // parentValue zinciri repository mock'unda null; doğrudan ID izinli.
        await expect(
            assertAttributeValuesAllowedForCategory(repository, ["childA"], ["childA"]),
        ).resolves.toBeUndefined()

        expect(calls).toHaveLength(1)
    })

    it("rejects a value that is not in the category allowlist", async () => {
        const repository = makeRepository({ modelA: makeValue("modelA", "model_type") })

        await expect(
            assertAttributeValuesAllowedForCategory(repository, ["modelA"], ["somethingElse"]),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Some selected attribute values are not allowed for this category",
        })
    })

    it("skips the check when the category has no allowlist", async () => {
        const { repository, calls } = makeCountingRepository({})

        await expect(
            assertAttributeValuesAllowedForCategory(repository, ["modelA"], []),
        ).resolves.toBeUndefined()

        // Allowlist boşken hiç sorgu atılmaz.
        expect(calls).toHaveLength(0)
    })
})

describe("productIndustrialUsages (rest)", () => {
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
