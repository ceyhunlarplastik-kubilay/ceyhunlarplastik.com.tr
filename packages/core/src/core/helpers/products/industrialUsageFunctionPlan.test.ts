import { describe, expect, it } from "vitest"

import {
    USAGE_FUNCTION_MAX_LENGTH,
    buildIndustrialUsageFunctionWritePlan,
    mapIndustrialUsageFunctionExport,
    type IndustrialUsageFunctionProductSource,
    type IndustrialUsageFunctionState,
} from "./industrialUsageFunctionPlan"

const PRODUCT_ID = "product-1"

function makeUsage(
    overrides: Partial<IndustrialUsageFunctionState> = {},
): IndustrialUsageFunctionState {
    return {
        id: "usage-1",
        productId: PRODUCT_ID,
        usageFunction: "Türkçe metin",
        translations: [{ locale: "tr", usageFunction: "Türkçe metin" }],
        ...overrides,
    }
}

describe("buildIndustrialUsageFunctionWritePlan", () => {
    it("yeni bir hedef dil metnini çeviri satırı olarak yazar", () => {
        const plan = buildIndustrialUsageFunctionWritePlan({
            productId: PRODUCT_ID,
            rows: [{ usageId: "usage-1", usageFunctions: { en: "English text" } }],
            usages: [makeUsage()],
        })

        expect(plan.baseUpdates).toEqual([])
        expect(plan.translationWrites).toEqual([
            { usageId: "usage-1", locale: "en", usageFunction: "English text" },
        ])
        expect(plan.stats.created).toBe(1)
        expect(plan.stats.touchedRows).toBe(1)
        expect(plan.stats.byLocale.en).toEqual({ created: 1, updated: 0, unchanged: 0 })
    })

    it("TR metnini hem base kolona hem tr çeviri satırına yazar", () => {
        const plan = buildIndustrialUsageFunctionWritePlan({
            productId: PRODUCT_ID,
            rows: [{ usageId: "usage-1", usageFunctions: { tr: "Yeni Türkçe metin" } }],
            usages: [makeUsage()],
        })

        expect(plan.baseUpdates).toEqual([
            { usageId: "usage-1", usageFunction: "Yeni Türkçe metin" },
        ])
        expect(plan.translationWrites).toEqual([
            { usageId: "usage-1", locale: "tr", usageFunction: "Yeni Türkçe metin" },
        ])
        expect(plan.stats.updated).toBe(1)
    })

    it("boş hücreyi atlar — içe aktarma hiçbir zaman silmez", () => {
        const plan = buildIndustrialUsageFunctionWritePlan({
            productId: PRODUCT_ID,
            rows: [{ usageId: "usage-1", usageFunctions: { en: "   ", de: "" } }],
            usages: [
                makeUsage({
                    translations: [
                        { locale: "tr", usageFunction: "Türkçe metin" },
                        { locale: "en", usageFunction: "Mevcut İngilizce" },
                    ],
                }),
            ],
        })

        expect(plan.translationWrites).toEqual([])
        expect(plan.stats.touchedRows).toBe(0)
    })

    it("aynı metni yeniden yazmaz", () => {
        const plan = buildIndustrialUsageFunctionWritePlan({
            productId: PRODUCT_ID,
            rows: [{ usageId: "usage-1", usageFunctions: { en: "Mevcut İngilizce" } }],
            usages: [
                makeUsage({
                    translations: [
                        { locale: "tr", usageFunction: "Türkçe metin" },
                        { locale: "en", usageFunction: "Mevcut İngilizce" },
                    ],
                }),
            ],
        })

        expect(plan.translationWrites).toEqual([])
        expect(plan.stats.unchanged).toBe(1)
        expect(plan.stats.byLocale.en).toEqual({ created: 0, updated: 0, unchanged: 1 })
    })

    it("TR metni yokken hedef dil yazılmasını reddeder", () => {
        expect(() =>
            buildIndustrialUsageFunctionWritePlan({
                productId: PRODUCT_ID,
                rows: [{ usageId: "usage-1", usageFunctions: { en: "English text" } }],
                usages: [makeUsage({ usageFunction: null, translations: [] })],
            }),
        ).toThrow(/Türkçe metin girilmeden/)
    })

    it("TR metni aynı dosyada geliyorsa hedef dile izin verir", () => {
        const plan = buildIndustrialUsageFunctionWritePlan({
            productId: PRODUCT_ID,
            rows: [
                {
                    usageId: "usage-1",
                    usageFunctions: { tr: "Türkçe metin", en: "English text" },
                },
            ],
            usages: [makeUsage({ usageFunction: null, translations: [] })],
        })

        expect(plan.baseUpdates).toHaveLength(1)
        expect(plan.translationWrites).toHaveLength(2)
        expect(plan.stats.created).toBe(2)
    })

    it("başka ürüne ait kullanım satırını reddeder", () => {
        expect(() =>
            buildIndustrialUsageFunctionWritePlan({
                productId: PRODUCT_ID,
                rows: [{ usageId: "usage-1", usageFunctions: { en: "English text" } }],
                usages: [makeUsage({ productId: "product-2" })],
            }),
        ).toThrow(/bu ürüne ait değil/)
    })

    it("bilinmeyen kullanım satırını reddeder", () => {
        expect(() =>
            buildIndustrialUsageFunctionWritePlan({
                productId: PRODUCT_ID,
                rows: [{ usageId: "missing", usageFunctions: { en: "English text" } }],
                usages: [makeUsage()],
            }),
        ).toThrow(/bulunamadı/)
    })

    it("aynı kullanım satırının iki kez gelmesini reddeder", () => {
        expect(() =>
            buildIndustrialUsageFunctionWritePlan({
                productId: PRODUCT_ID,
                rows: [
                    { usageId: "usage-1", usageFunctions: { en: "A" } },
                    { usageId: "usage-1", usageFunctions: { de: "B" } },
                ],
                usages: [makeUsage()],
            }),
        ).toThrow(/birden fazla kez/)
    })

    it("karakter sınırını aşan metni reddeder", () => {
        expect(() =>
            buildIndustrialUsageFunctionWritePlan({
                productId: PRODUCT_ID,
                rows: [
                    {
                        usageId: "usage-1",
                        usageFunctions: { en: "a".repeat(USAGE_FUNCTION_MAX_LENGTH + 1) },
                    },
                ],
                usages: [makeUsage()],
            }),
        ).toThrow(/karakter sınırını aşıyor/)
    })

    it("dil sırasını SUPPORTED_LOCALES'ten alır", () => {
        const plan = buildIndustrialUsageFunctionWritePlan({
            productId: PRODUCT_ID,
            rows: [
                {
                    usageId: "usage-1",
                    usageFunctions: { hi: "हिन्दी", en: "English", de: "Deutsch" },
                },
            ],
            usages: [makeUsage()],
        })

        expect(plan.translationWrites.map((write) => write.locale)).toEqual(["en", "de", "hi"])
    })
})

function makeProductSource(): IndustrialUsageFunctionProductSource {
    return {
        id: PRODUCT_ID,
        code: "10.11",
        name: "Bakalit Tutamak",
        slug: "bakalit-tutamak",
        category: { name: "Tutamaklar" },
        translations: [
            { locale: "tr", name: "Yok sayılmalı" },
            { locale: "en", name: "Bakelite Handle" },
            { locale: "xx", name: "Desteklenmeyen dil" },
        ],
        industrialUsages: [
            {
                id: "usage-2",
                displayOrder: 1,
                usageFunction: "İkinci satır",
                sectorValue: {
                    id: "sector-1",
                    name: "Otomotiv",
                    translations: [{ locale: "en", name: "Automotive" }],
                },
                productionGroupValue: null,
                usageAreaValue: null,
                translations: [{ locale: "en", usageFunction: "Second row" }],
            },
            {
                id: "usage-1",
                displayOrder: 0,
                usageFunction: null,
                sectorValue: {
                    id: "sector-1",
                    name: "Otomotiv",
                    translations: [{ locale: "en", name: "Automotive" }],
                },
                productionGroupValue: null,
                usageAreaValue: null,
                translations: [{ locale: "en", usageFunction: "   " }],
            },
        ],
    }
}

describe("mapIndustrialUsageFunctionExport", () => {
    it("varsayılan dili kaydın kolonundan, hedef dilleri çevirilerden toplar", () => {
        const result = mapIndustrialUsageFunctionExport(makeProductSource())

        expect(result.product.names).toEqual({
            tr: "Bakalit Tutamak",
            en: "Bakelite Handle",
        })
        expect(result.rows[0].usageFunctions).toEqual({
            tr: "İkinci satır",
            en: "Second row",
        })
    })

    it("boş çeviri metnini taşımaz", () => {
        const result = mapIndustrialUsageFunctionExport(makeProductSource())

        expect(result.rows[1].usageFunctions).toEqual({})
    })

    it("taksonomi adlarını satır başına tekrar etmeden sözlükte toplar", () => {
        const result = mapIndustrialUsageFunctionExport(makeProductSource())

        expect(Object.keys(result.taxonomy)).toEqual(["sector-1"])
        expect(result.taxonomy["sector-1"]).toEqual({ tr: "Otomotiv", en: "Automotive" })
        expect(result.rows.map((row) => row.sectorValueId)).toEqual(["sector-1", "sector-1"])
    })

    it("satır sırasını girdiden korur (sorgu displayOrder ile sıralar)", () => {
        const result = mapIndustrialUsageFunctionExport(makeProductSource())

        expect(result.rows.map((row) => row.usageId)).toEqual(["usage-2", "usage-1"])
    })
})
