import { describe, expect, it } from "vitest"

import type { ProductionMachine } from "@/features/production/machines/api/types"
import type { Mold } from "@/features/production/molds/api/types"
import { buildCompatibilityMatrix } from "./buildCompatibilityMatrix"

const machine = (overrides: Partial<ProductionMachine>) => ({
    id: "m",
    code: "M",
    name: "Makine",
    areaId: "a1",
    area: { id: "a1", code: "P1", name: "Parkur 1" },
    status: "ACTIVE",
    clampForceTon: 50,
    tieBarHorizontalMm: 320,
    tieBarVerticalMm: 320,
    minMoldHeightMm: 200,
    maxMoldHeightMm: null,
    maxOpeningStrokeMm: 350,
    maxDaylightMm: 550,
    shotCapacityG: 65,
    locatingRingDiameterMm: 125,
    hotRunnerZones: 0,
    coreCircuits: 1,
    hasRobot: true,
    ...overrides,
}) as ProductionMachine

const mold = (overrides: Partial<Mold>) => ({
    id: "k",
    code: "K",
    name: "Kalıp",
    status: "ACTIVE",
    requiredClampForceTon: 30,
    widthMm: 246,
    heightMm: 246,
    thicknessMm: 226,
    requiredOpeningStrokeMm: 150,
    locatingRingDiameterMm: 125,
    hotRunnerZones: 0,
    coreCircuitsRequired: 0,
    requiresRobot: false,
    runnerWeightG: 5.6,
    storageLocation: null,
    outputs: [{
        id: "o",
        productSizeId: "s",
        cavities: 8,
        partWeightG: 3.6,
        product: { id: "p", code: "10.1", name: "Kare profil tapası" },
        size: { id: "s", code: 3, sizeCode: "10.1.3", label: "30×30" },
    }],
    machineProfiles: [],
    ...overrides,
}) as Mold

const arburg = machine({ id: "m-01", code: "M-01" })
const toggle = machine({
    id: "m-02",
    code: "M-02",
    areaId: "a2",
    area: { id: "a2", code: "P2", name: "Parkur 2" },
    clampForceTon: 120,
    tieBarHorizontalMm: 410,
    tieBarVerticalMm: 410,
    minMoldHeightMm: 150,
    maxMoldHeightMm: 480,
    maxOpeningStrokeMm: 390,
    maxDaylightMm: null,
    shotCapacityG: 185,
    locatingRingDiameterMm: 100,
})
const retiredMachine = machine({ id: "m-03", code: "M-03", status: "INACTIVE" })

const molds = [
    mold({ id: "k-1001", code: "K-1001" }),
    mold({ id: "k-9001", code: "K-9001", requiredClampForceTon: 65 }),
    mold({ id: "k-old", code: "K-0001", status: "RETIRED" }),
]
const machines = [arburg, toggle, retiredMachine]

const defaults = { search: "", areaId: "", showInactive: false }

describe("buildCompatibilityMatrix", () => {
    it("kullanım dışıları gizler; her kalıba en küçük uygun makineyi önerir", () => {
        const matrix = buildCompatibilityMatrix(molds, machines, defaults)

        expect(matrix.machines.map((entry) => entry.code)).toEqual(["M-01", "M-02"])
        expect(matrix.rows.map((row) => row.mold.code)).toEqual(["K-1001", "K-9001"])

        const [k1001, k9001] = matrix.rows
        // M-02'de bilezik farkı (dikkat) var; M-01 hem uygun hem küçük.
        expect(k1001.cells.find((cell) => cell.isRecommended)?.machine.code).toBe("M-01")
        expect(k1001.usableCount).toBe(2)
        expect(k1001.shotWeightG).toBe(34.4)
        // 65 t M-01'e sığmaz; tek aday M-02.
        expect(k9001.cells.map((cell) => cell.result.verdict)).toEqual(["error", "warning"])
        expect(k9001.cells.find((cell) => cell.isRecommended)?.machine.code).toBe("M-02")

        const total = Object.values(matrix.totals).reduce((sum, count) => sum + count, 0)
        expect(total).toBe(matrix.rows.length * matrix.machines.length)
    })

    it("alan filtresi sütunları daraltır; öneri o alandaki makineler arasından yapılır", () => {
        const matrix = buildCompatibilityMatrix(molds, machines, { ...defaults, areaId: "a2" })

        expect(matrix.machines.map((entry) => entry.code)).toEqual(["M-02"])
        expect(matrix.rows[0].cells[0].isRecommended).toBe(true)
    })

    it("aramayla kalıpları daraltır; istenirse kullanım dışıları da gösterir", () => {
        expect(buildCompatibilityMatrix(molds, machines, { ...defaults, search: "k-9001" }).rows).toHaveLength(1)

        const all = buildCompatibilityMatrix(molds, machines, { ...defaults, showInactive: true })
        expect(all.machines).toHaveLength(3)
        expect(all.rows).toHaveLength(3)
        expect(all.rows.find((row) => row.mold.code === "K-0001")?.usableCount).toBe(0)
    })
})
