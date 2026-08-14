import { describe, expect, it } from "vitest"

import type { CustomerAssignedProduct } from "@/features/admin/customers/api/types"
import { applyFavoriteToggle } from "./favoriteVariantList"

function row(
    productVariantId: string,
    source: CustomerAssignedProduct["source"],
    id = `${source}-${productVariantId}`,
): CustomerAssignedProduct {
    return { id, productVariantId, source } as CustomerAssignedProduct
}

describe("applyFavoriteToggle", () => {
    it("favoriye eklerken CUSTOMER satırı üretir", () => {
        const result = applyFavoriteToggle([], "var-1", true)

        expect(result).toHaveLength(1)
        expect(result[0].productVariantId).toBe("var-1")
        expect(result[0].source).toBe("CUSTOMER")
    })

    it("aynı varyantı ikinci kez eklemez", () => {
        const items = [row("var-1", "CUSTOMER")]

        expect(applyFavoriteToggle(items, "var-1", true)).toBe(items)
    })

    it("temsilci ataması varken de kendi favorisi ayrıca eklenebilir", () => {
        const result = applyFavoriteToggle([row("var-1", "STAFF")], "var-1", true)

        expect(result.map((item) => item.source)).toEqual(["STAFF", "CUSTOMER"])
    })

    it("favoriden çıkarınca aynı varyantın TEMSİLCİ ataması listede kalır", () => {
        const items = [row("var-1", "STAFF"), row("var-1", "CUSTOMER")]

        const result = applyFavoriteToggle(items, "var-1", false)

        expect(result).toHaveLength(1)
        expect(result[0].source).toBe("STAFF")
    })

    it("başka varyantlara dokunmaz", () => {
        const items = [row("var-1", "CUSTOMER"), row("var-2", "CUSTOMER")]

        const result = applyFavoriteToggle(items, "var-1", false)

        expect(result.map((item) => item.productVariantId)).toEqual(["var-2"])
    })

    it("favoride olmayan varyantı çıkarmak listeyi bozmaz", () => {
        const items = [row("var-1", "STAFF")]

        expect(applyFavoriteToggle(items, "var-9", false)).toEqual(items)
    })
})
