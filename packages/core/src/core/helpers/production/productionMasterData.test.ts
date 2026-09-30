import { describe, expect, it } from "vitest"

import { findMachineSpecIssues, normalizeProductionCode } from "./productionMasterData"

describe("normalizeProductionCode", () => {
    it("kırpar, iç boşlukları teke indirir ve büyük harfe çevirir", () => {
        expect(normalizeProductionCode("  m-01 ")).toBe("M-01")
        expect(normalizeProductionCode("parkur   1")).toBe("PARKUR 1")
    })
})

describe("findMachineSpecIssues", () => {
    it("minimum kalıp kalınlığı maksimumu geçemez", () => {
        expect(findMachineSpecIssues({ minMoldHeightMm: 400, maxMoldHeightMm: 300 })).toHaveLength(1)
    })

    it("plaka açıklığı verilmişse kalınlıklar ondan küçük, strok en fazla ona eşit olmalı", () => {
        // Arburg ALLROUNDER 320 C föyü: en ince 200, açıklık 550, strok 350.
        expect(findMachineSpecIssues({ minMoldHeightMm: 200, maxOpeningStrokeMm: 350, maxDaylightMm: 550 })).toEqual([])
        expect(findMachineSpecIssues({ minMoldHeightMm: 200, maxMoldHeightMm: 550, maxDaylightMm: 550 })).toHaveLength(1)
        expect(findMachineSpecIssues({ maxOpeningStrokeMm: 600, maxDaylightMm: 550 })).toHaveLength(1)
        expect(findMachineSpecIssues({ minMoldHeightMm: 550, maxDaylightMm: 550 })).toHaveLength(1)
    })

    it("eşitlik ve eksik değer sorun değildir", () => {
        expect(findMachineSpecIssues({ minMoldHeightMm: 300, maxMoldHeightMm: 300 })).toEqual([])
        expect(findMachineSpecIssues({ minMoldHeightMm: 300, maxMoldHeightMm: null })).toEqual([])
        expect(findMachineSpecIssues({})).toEqual([])
    })
})
