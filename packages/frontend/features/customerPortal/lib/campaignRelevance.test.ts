import { describe, expect, it } from "vitest"

import type { ProductVariantCampaign } from "@/features/sales/campaigns/api/types"
import { flattenCampaignVariants } from "./campaignRelevance"

function campaign(
    id: string,
    discountPercent: number,
    items: Array<{ productVariantId: string; discountPercent?: number | null }>,
    overrides: Partial<ProductVariantCampaign> = {},
): ProductVariantCampaign {
    return {
        id,
        title: `Kampanya ${id}`,
        discountPercent,
        status: "ACTIVE",
        createdByUserId: "u1",
        createdAt: "",
        updatedAt: "",
        items: items.map((item, index) => ({
            id: `${id}-${index}`,
            campaignId: id,
            productVariantId: item.productVariantId,
            discountPercent: item.discountPercent ?? null,
            displayOrder: index,
        })),
        ...overrides,
    } as ProductVariantCampaign
}

describe("flattenCampaignVariants", () => {
    it("kampanyaları varyant satırlarına açar", () => {
        const result = flattenCampaignVariants(
            [campaign("c1", 10, [{ productVariantId: "v1" }, { productVariantId: "v2" }])],
            new Set(),
        )

        expect(result).toHaveLength(2)
        expect(result.map((entry) => entry.productVariantId).sort()).toEqual(["v1", "v2"])
    })

    it("kalem oranı kampanya geneline üstün gelir", () => {
        const result = flattenCampaignVariants(
            [campaign("c1", 10, [{ productVariantId: "v1", discountPercent: 30 }])],
            new Set(),
        )

        expect(result[0].discountPercent).toBe(30)
    })

    it("müşterinin varyantlarını ilgili işaretler", () => {
        const result = flattenCampaignVariants(
            [campaign("c1", 10, [{ productVariantId: "v1" }, { productVariantId: "v2" }])],
            new Set(["v2"]),
        )

        const byVariant = Object.fromEntries(result.map((entry) => [entry.productVariantId, entry.isRelevant]))
        expect(byVariant).toEqual({ v1: false, v2: true })
    })

    it("aynı varyant iki kampanyadaysa ikisini de ayrı satır tutar", () => {
        const result = flattenCampaignVariants(
            [
                campaign("c1", 10, [{ productVariantId: "v1" }]),
                campaign("c2", 20, [{ productVariantId: "v1" }]),
            ],
            new Set(),
        )

        expect(result).toHaveLength(2)
        expect(new Set(result.map((entry) => entry.key)).size).toBe(2)
    })

    it("en yüksek indirimi başa alır", () => {
        const result = flattenCampaignVariants(
            [
                campaign("c1", 10, [{ productVariantId: "v1" }]),
                campaign("c2", 35, [{ productVariantId: "v2" }]),
                campaign("c3", 20, [{ productVariantId: "v3" }]),
            ],
            new Set(),
        )

        expect(result.map((entry) => entry.discountPercent)).toEqual([35, 20, 10])
    })

    it("kalemi olmayan kampanya satır üretmez", () => {
        expect(flattenCampaignVariants([campaign("c1", 10, [])], new Set())).toEqual([])
    })
})
