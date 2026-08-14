import { describe, expect, it } from "vitest"

import { resolvePortalDraftPricing } from "./portalDraftPricing"

/**
 * Bu zincir core'daki `resolveCustomerVariantPrice` ile aynı kuralları uygular.
 * İki uygulama ayrı olduğu için kampanya kuralları burada da sınanır — biri
 * değişip diğeri unutulursa test yakalar.
 */
describe("portal fiyatında kampanya indirimi", () => {
    const base = { listUnitPrice: 100, currency: "TRY" }

    it("kampanya oranı genel iskontodan büyükse kampanya uygulanır", () => {
        const resolved = resolvePortalDraftPricing({
            ...base,
            generalDiscountPercent: 10,
            campaignDiscountPercent: 25,
        })

        expect(resolved.priceSource).toBe("CAMPAIGN_DISCOUNT")
        expect(resolved.appliedDiscountPercent).toBe(25)
        expect(resolved.customerUnitPrice).toBe(75)
    })

    it("kampanya müşteriyi cezalandırmaz: genel iskonto daha iyiyse o kalır", () => {
        const resolved = resolvePortalDraftPricing({
            ...base,
            generalDiscountPercent: 30,
            campaignDiscountPercent: 10,
        })

        expect(resolved.priceSource).toBe("CUSTOMER_GENERAL_DISCOUNT")
        expect(resolved.appliedDiscountPercent).toBe(30)
        expect(resolved.customerUnitPrice).toBe(70)
    })

    it("eşitlikte etiket genel iskontoda kalır", () => {
        const resolved = resolvePortalDraftPricing({
            ...base,
            generalDiscountPercent: 15,
            campaignDiscountPercent: 15,
        })

        expect(resolved.priceSource).toBe("CUSTOMER_GENERAL_DISCOUNT")
    })

    it("uygun özel fiyat kampanyayı ezer", () => {
        const resolved = resolvePortalDraftPricing({
            ...base,
            generalDiscountPercent: 0,
            campaignDiscountPercent: 90,
            specialPrice: {
                id: "sp-1",
                price: 75,
                currency: "TRY",
                isActive: true,
            } as never,
        })

        expect(resolved.priceSource).toBe("CUSTOMER_SPECIAL_PRICE")
        expect(resolved.customerUnitPrice).toBe(75)
    })

    it("kampanya yoksa davranış değişmez", () => {
        const resolved = resolvePortalDraftPricing({
            ...base,
            generalDiscountPercent: 0,
        })

        expect(resolved.priceSource).toBe("LIST_PRICE")
        expect(resolved.customerUnitPrice).toBe(100)
    })
})
