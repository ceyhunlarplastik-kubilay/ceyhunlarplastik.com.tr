import { describe, expect, it } from "vitest"
import { resolveCustomerVariantPrice } from "./customerPricing"

const variant = {
    variantSuppliers: [
        {
            listPrice: 100,
            currency: "TRY",
        },
    ],
}

describe("resolveCustomerVariantPrice", () => {
    it("uses eligible customer special price before general discount", () => {
        const resolved = resolveCustomerVariantPrice({
            customer: { generalDiscountPercent: 20 },
            variant,
            quantity: 10,
            now: new Date("2026-01-15T00:00:00.000Z"),
            specialPrice: {
                id: "sp-1",
                price: 75,
                currency: "TRY",
                minOrderQuantity: 5,
                validFrom: "2026-01-01T00:00:00.000Z",
                validUntil: "2026-12-31T23:59:59.000Z",
                isActive: true,
            },
        })

        expect(resolved.finalPrice).toBe(75)
        expect(resolved.priceSource).toBe("CUSTOMER_SPECIAL_PRICE")
        expect(resolved.specialPriceApplied).toBe(true)
        expect(resolved.appliedDiscountPercent).toBe(0)
    })

    it("falls back to general discount when minimum quantity is not met", () => {
        const resolved = resolveCustomerVariantPrice({
            customer: { generalDiscountPercent: 10 },
            variant,
            quantity: 3,
            specialPrice: {
                id: "sp-1",
                price: 70,
                currency: "TRY",
                minOrderQuantity: 5,
                isActive: true,
            },
        })

        expect(resolved.finalPrice).toBe(90)
        expect(resolved.priceSource).toBe("CUSTOMER_GENERAL_DISCOUNT")
        expect(resolved.specialPriceApplied).toBe(false)
        expect(resolved.specialPriceEligible).toBe(false)
        expect(resolved.ineligibilityReason).toBe("MIN_ORDER_QUANTITY_NOT_MET")
    })

    it("falls back to list price when maximum quantity is exceeded and no discount exists", () => {
        const resolved = resolveCustomerVariantPrice({
            customer: {},
            variant,
            quantity: 1001,
            specialPrice: {
                id: "sp-1",
                price: 70,
                currency: "TRY",
                maxOrderQuantity: 1000,
                isActive: true,
            },
        })

        expect(resolved.finalPrice).toBe(100)
        expect(resolved.priceSource).toBe("LIST_PRICE")
        expect(resolved.specialPriceApplied).toBe(false)
        expect(resolved.ineligibilityReason).toBe("MAX_ORDER_QUANTITY_EXCEEDED")
    })

    it("uses general discount when there is no special price", () => {
        const resolved = resolveCustomerVariantPrice({
            customer: { generalDiscountPercent: 12.5 },
            variant,
        })

        expect(resolved.finalPrice).toBe(87.5)
        expect(resolved.priceSource).toBe("CUSTOMER_GENERAL_DISCOUNT")
    })

    it("uses list price without special price or discount", () => {
        const resolved = resolveCustomerVariantPrice({
            customer: {},
            variant,
        })

        expect(resolved.finalPrice).toBe(100)
        expect(resolved.priceSource).toBe("LIST_PRICE")
    })
})
