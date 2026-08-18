import { describe, expect, it } from "vitest"

import { ALL_SECTORS, matchesUsageAreaFilter } from "./usageAreaFilter"

const value = { id: "ua1", name: "Duvar Rafları", parentValueId: "grp1" }

function input(overrides: Partial<Parameters<typeof matchesUsageAreaFilter>[1]> = {}) {
    return {
        sectorId: "sec1",
        sectorName: "Mobilya",
        sectorFilterId: ALL_SECTORS,
        productionGroupFilterId: null,
        isSelected: false,
        search: "",
        ...overrides,
    }
}

describe("matchesUsageAreaFilter", () => {
    it("filtre yoksa geçer", () => {
        expect(matchesUsageAreaFilter(value, input())).toBe(true)
    })

    it("sektör filtresi eşleşmezse düşer", () => {
        expect(matchesUsageAreaFilter(value, input({ sectorFilterId: "sec2" }))).toBe(false)
    })

    it("sektör filtresi eşleşirse geçer", () => {
        expect(matchesUsageAreaFilter(value, input({ sectorFilterId: "sec1" }))).toBe(true)
    })

    it("ÜRETİM GRUBU filtresi eşleşmezse düşer", () => {
        // Bildirilen hata: grup seçimi listeyi hiç daraltmıyordu.
        expect(matchesUsageAreaFilter(value, input({ productionGroupFilterId: "grp2" }))).toBe(false)
    })

    it("üretim grubu filtresi eşleşirse geçer", () => {
        expect(matchesUsageAreaFilter(value, input({ productionGroupFilterId: "grp1" }))).toBe(true)
    })

    it("grubu olmayan kullanım alanı, grup filtresi varken düşer", () => {
        expect(matchesUsageAreaFilter(
            { id: "ua2", name: "Serbest", parentValueId: null },
            input({ productionGroupFilterId: "grp1" }),
        )).toBe(false)
    })

    it("sektör ve grup birlikte uygulanır", () => {
        expect(matchesUsageAreaFilter(value, input({
            sectorFilterId: "sec1",
            productionGroupFilterId: "grp1",
        }))).toBe(true)

        expect(matchesUsageAreaFilter(value, input({
            sectorFilterId: "sec1",
            productionGroupFilterId: "grp2",
        }))).toBe(false)
    })

    it("SEÇİLİ olan filtre dışında kalsa bile görünür", () => {
        expect(matchesUsageAreaFilter(value, input({
            sectorFilterId: "sec2",
            productionGroupFilterId: "grp2",
            isSelected: true,
        }))).toBe(true)
    })

    it("arama seçili olanı da süzebilir", () => {
        expect(matchesUsageAreaFilter(value, input({ isSelected: true, search: "vida" }))).toBe(false)
        expect(matchesUsageAreaFilter(value, input({ isSelected: true, search: "raf" }))).toBe(true)
    })

    it("arama sektör adında da eşleşir", () => {
        expect(matchesUsageAreaFilter(value, input({ search: "mobilya" }))).toBe(true)
    })
})
