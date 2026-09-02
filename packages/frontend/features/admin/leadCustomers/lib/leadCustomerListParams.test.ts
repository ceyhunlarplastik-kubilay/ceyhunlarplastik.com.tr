import { describe, expect, it } from "vitest"

import { buildLeadCustomerListParams, hasActiveLeadCustomerFilters } from "./leadCustomerListParams"

function state(overrides: Partial<Parameters<typeof buildLeadCustomerListParams>[0]> = {}) {
    return {
        search: "",
        sectorValueId: "",
        usageAreaValueId: "",
        countryId: null,
        stateId: null,
        cityId: null,
        page: 1,
        limit: 20,
        ...overrides,
    }
}

describe("buildLeadCustomerListParams", () => {
    it("boş filtrede yalnız sayfalama alanları gider", () => {
        expect(buildLeadCustomerListParams(state())).toEqual({ page: 1, limit: 20 })
    })

    it("arama trimlenir ve yalnız doluysa eklenir", () => {
        expect(buildLeadCustomerListParams(state({ search: "  Acme  " }))).toEqual({
            page: 1,
            limit: 20,
            search: "Acme",
        })
        expect(buildLeadCustomerListParams(state({ search: "   " }))).toEqual({ page: 1, limit: 20 })
    })

    it("sektör/kullanım alanı/geo dolu olduğunda parametreye girer", () => {
        expect(
            buildLeadCustomerListParams(
                state({ sectorValueId: "sec1", usageAreaValueId: "ua1", countryId: 1, stateId: 2, cityId: 3 }),
            ),
        ).toEqual({
            page: 1,
            limit: 20,
            sectorValueId: "sec1",
            usageAreaValueId: "ua1",
            countryId: 1,
            stateId: 2,
            cityId: 3,
        })
    })
})

describe("hasActiveLeadCustomerFilters", () => {
    it("boş filtrede false", () => {
        expect(hasActiveLeadCustomerFilters(state())).toBe(false)
    })

    it("yalnız ülke seçiliyken false (varsayılan Türkiye)", () => {
        expect(hasActiveLeadCustomerFilters(state({ countryId: 1 }))).toBe(false)
    })

    it("il/ilçe/arama/sektör/kullanım alanından biri varsa true", () => {
        expect(hasActiveLeadCustomerFilters(state({ stateId: 2 }))).toBe(true)
        expect(hasActiveLeadCustomerFilters(state({ cityId: 3 }))).toBe(true)
        expect(hasActiveLeadCustomerFilters(state({ search: "x" }))).toBe(true)
        expect(hasActiveLeadCustomerFilters(state({ sectorValueId: "s" }))).toBe(true)
        expect(hasActiveLeadCustomerFilters(state({ usageAreaValueId: "u" }))).toBe(true)
    })
})
