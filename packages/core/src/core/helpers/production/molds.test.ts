import { describe, expect, it } from "vitest"

import {
    computeShotWeightG,
    findMoldMachineProfileIssues,
    findMoldOutputIssues,
    findMoldSpecIssues,
    sumCavities,
} from "./molds"

describe("findMoldOutputIssues", () => {
    it("aile kalıbını (farklı ölçüler) kabul eder", () => {
        expect(findMoldOutputIssues([
            { productSizeId: "size-a", cavities: 2 },
            { productSizeId: "size-b", cavities: 4 },
        ])).toEqual([])
    })

    it("aynı ölçünün iki kez girilmesini ve geçersiz göz sayısını yakalar", () => {
        const issues = findMoldOutputIssues([
            { productSizeId: "size-a", cavities: 2 },
            { productSizeId: "size-a", cavities: 0 },
        ])

        expect(issues).toHaveLength(2)
    })
})

describe("findMoldMachineProfileIssues", () => {
    it("aynı makineyi ve tercih + engel çelişkisini yakalar", () => {
        expect(findMoldMachineProfileIssues([
            { machineId: "m1", isPreferred: true, isBlocked: false },
            { machineId: "m1", isPreferred: false, isBlocked: false },
        ])).toHaveLength(1)
        expect(findMoldMachineProfileIssues([
            { machineId: "m1", isPreferred: true, isBlocked: true },
        ])).toHaveLength(1)
        expect(findMoldMachineProfileIssues([
            { machineId: "m1", isPreferred: true, isBlocked: false },
            { machineId: "m2", isPreferred: false, isBlocked: true },
        ])).toEqual([])
    })
})

describe("findMoldSpecIssues", () => {
    it("son bakımdaki sayaç toplamı geçemez", () => {
        expect(findMoldSpecIssues({ totalShots: 100, shotsAtLastMaintenance: 150 })).toHaveLength(1)
        expect(findMoldSpecIssues({ totalShots: 150, shotsAtLastMaintenance: 100 })).toEqual([])
    })
})

describe("baskı ağırlığı ve göz toplamı", () => {
    it("Σ(göz × parça) + yolluk; parça ağırlığı eksikse hesaplanmaz", () => {
        const outputs = [
            { cavities: 2, partWeightG: 12.5 },
            { cavities: 4, partWeightG: 8 },
        ]

        expect(sumCavities(outputs)).toBe(6)
        expect(computeShotWeightG(outputs, 10)).toBe(67)
        expect(computeShotWeightG([{ cavities: 2, partWeightG: null }], 10)).toBeNull()
        expect(computeShotWeightG([], 10)).toBeNull()
    })
})
