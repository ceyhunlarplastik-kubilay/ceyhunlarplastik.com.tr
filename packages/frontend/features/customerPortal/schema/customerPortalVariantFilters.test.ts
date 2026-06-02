import { describe, expect, it } from "vitest"
import {
    buildVariantFilterDefaultValues,
    countActiveVariantFilters,
    normalizeVariantPriceRange,
    parseVariantFilterPrice,
} from "./customerPortalVariantFilters"

describe("customer portal variant filters", () => {
    it("parses local price input safely", () => {
        expect(parseVariantFilterPrice("1.250")).toBe(1250)
        expect(parseVariantFilterPrice("1.250,50")).toBe(1250.5)
        expect(parseVariantFilterPrice("0.22")).toBe(0.22)
        expect(parseVariantFilterPrice("1,32")).toBe(1.32)
        expect(parseVariantFilterPrice("")).toBeNull()
    })

    it("normalizes range to the available bounds", () => {
        expect(
            normalizeVariantPriceRange(
                { minPrice: "50", maxPrice: "5000" },
                { min: 100, max: 2500, currency: "TRY" },
            ),
        ).toEqual({
            minPrice: 100,
            maxPrice: 2500,
        })
    })

    it("counts active filters including custom price band", () => {
        expect(
            countActiveVariantFilters(
                {
                    colorIds: ["c1"],
                    materialIds: ["m1", "m2"],
                    minPrice: 200,
                    maxPrice: 900,
                },
                { min: 100, max: 1000, currency: "TRY" },
            ),
        ).toBe(4)
    })

    it("builds defaults from price bounds", () => {
        expect(
            buildVariantFilterDefaultValues({ min: 99, max: 999, currency: "TRY" }),
        ).toEqual({
            colorIds: [],
            materialIds: [],
            minPrice: "99",
            maxPrice: "999",
        })
    })

    it("preserves decimal bounds in defaults", () => {
        expect(
            buildVariantFilterDefaultValues({ min: 0.22, max: 1.32, currency: "TRY" }),
        ).toEqual({
            colorIds: [],
            materialIds: [],
            minPrice: "0,22",
            maxPrice: "1,32",
        })
    })
})
