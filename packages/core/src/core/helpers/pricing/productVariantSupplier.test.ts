import { describe, expect, it } from "vitest"
import {
    decimalLikeToNumber,
    resolveProductVariantSupplierPricing,
} from "./productVariantSupplier"

describe("decimalLikeToNumber", () => {
    it("returns undefined for null and undefined", () => {
        expect(decimalLikeToNumber(null)).toBeUndefined()
        expect(decimalLikeToNumber(undefined)).toBeUndefined()
    })

    it("passes through finite numbers and rejects non-finite ones", () => {
        expect(decimalLikeToNumber(12.5)).toBe(12.5)
        expect(decimalLikeToNumber(0)).toBe(0)
        expect(decimalLikeToNumber(Number.NaN)).toBeUndefined()
        expect(decimalLikeToNumber(Number.POSITIVE_INFINITY)).toBeUndefined()
    })

    it("parses numeric strings and rejects non-numeric ones", () => {
        expect(decimalLikeToNumber("42.75")).toBe(42.75)
        expect(decimalLikeToNumber("abc")).toBeUndefined()
    })

    it("unwraps Prisma Decimal-like objects via toNumber()", () => {
        expect(decimalLikeToNumber({ toNumber: () => 7.25 })).toBe(7.25)
        expect(decimalLikeToNumber({ toNumber: () => Number.NaN })).toBeUndefined()
    })
})

describe("resolveProductVariantSupplierPricing", () => {
    it("derives netCost from price and operational cost rate", () => {
        const result = resolveProductVariantSupplierPricing({
            price: 100,
            operationalCostRate: 10,
        })

        expect(result.price).toBe(100)
        expect(result.operationalCostRate).toBe(10)
        expect(result.netCost).toBe(110)
    })

    it("derives listPrice from netCost and profit rate", () => {
        const result = resolveProductVariantSupplierPricing({
            price: 100,
            operationalCostRate: 10,
            profitRate: 20,
        })

        expect(result.netCost).toBe(110)
        expect(result.profitRate).toBe(20)
        expect(result.listPrice).toBe(132) // 110 * 1.2
    })

    it("prefers an explicit netCost over the derived one", () => {
        const result = resolveProductVariantSupplierPricing({
            price: 100,
            operationalCostRate: 10,
            netCost: 50,
            profitRate: 100,
        })

        expect(result.netCost).toBe(50)
        expect(result.listPrice).toBe(100) // 50 * 2, NOT 110 * 2
    })

    it("derives profitRate backwards from an explicit listPrice", () => {
        const result = resolveProductVariantSupplierPricing({
            price: 100,
            listPrice: 130,
        })

        // opRate yok → netCost = price; profitRate = (130-100)/100 * 100
        expect(result.netCost).toBe(100)
        expect(result.listPrice).toBe(130)
        expect(result.profitRate).toBe(30)
    })

    it("falls back to existing operational/profit rates when input omits them", () => {
        const result = resolveProductVariantSupplierPricing(
            { price: 100 },
            {
                operationalCostRate: { toNumber: () => 15 }, // Prisma Decimal-like
                profitRate: "20",
            },
        )

        expect(result.netCost).toBe(115)
        expect(result.profitRate).toBe(20)
        expect(result.listPrice).toBe(138) // 115 * 1.2
    })

    it("does not invent profitRate/listPrice when neither input nor existing has them", () => {
        const result = resolveProductVariantSupplierPricing({ price: 100 })

        expect(result.netCost).toBe(100) // opRate 0 varsayılanı
        expect(result.profitRate).toBeUndefined()
        expect(result.listPrice).toBeUndefined()
    })

    it("rounds every money field to 2 decimals", () => {
        const result = resolveProductVariantSupplierPricing({
            price: 99.999,
            operationalCostRate: 7.5,
        })

        expect(result.price).toBe(100)
        // 99.999 * 1.075 = 107.498925 → 107.5 (türetme HAM price ile yapılır)
        expect(result.netCost).toBe(107.5)
    })

    it("stamps pricingUpdatedAt only when a pricing field is provided", () => {
        const touched = resolveProductVariantSupplierPricing({ price: 1 })
        const untouched = resolveProductVariantSupplierPricing({})

        expect(touched.pricingUpdatedAt).toBeInstanceOf(Date)
        expect(untouched.pricingUpdatedAt).toBeUndefined()
        expect(untouched).toEqual({})
    })
})
