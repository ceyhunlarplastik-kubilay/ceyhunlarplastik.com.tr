import { describe, expect, it } from "vitest"

import {
    buildProductionMachinePayload,
    createProductionMachineFormDefaults,
    productionMachineFormSchema,
} from "./productionMachineForm"

const AREA_ID = "33333333-3333-4333-8333-333333333333"

function validInput(overrides: Record<string, unknown> = {}) {
    return {
        ...createProductionMachineFormDefaults(null, AREA_ID),
        code: "m-01",
        name: "Enjeksiyon 1",
        clampForceTon: "120",
        ...overrides,
    }
}

describe("productionMachineFormSchema", () => {
    it("metinleri sayıya çevirir: boş → null, ondalık virgül kabul", () => {
        const parsed = productionMachineFormSchema.parse(validInput({ shotCapacityG: "185,5", tieBarHorizontalMm: "" }))
        const payload = buildProductionMachinePayload(parsed)

        expect(payload.clampForceTon).toBe(120)
        expect(payload.shotCapacityG).toBe(185.5)
        expect(payload.tieBarHorizontalMm).toBeNull()
        expect(payload.plannedEfficiencyPercent).toBe(85)
        expect(payload.brand).toBeNull()
        expect(payload.shiftPatternId).toBeNull()
    })

    it("kapama kuvveti zorunlu", () => {
        expect(productionMachineFormSchema.safeParse(validInput({ clampForceTon: "" })).success).toBe(false)
    })

    it("minimum kalıp kalınlığı maksimumu geçemez (sunucuyla aynı kural)", () => {
        const result = productionMachineFormSchema.safeParse(validInput({ minMoldHeightMm: "500", maxMoldHeightMm: "300" }))

        expect(result.success).toBe(false)
        expect(result.error?.issues.some((issue) => issue.path[0] === "maxMoldHeightMm")).toBe(true)
    })

    it("plaka açıklığı: Arburg 320 C değerleri geçer, açıklığa eşit maks. kalınlık ilgili alanda hata verir", () => {
        const arburg = { minMoldHeightMm: "200", maxOpeningStrokeMm: "350", maxDaylightMm: "550" }

        const parsed = productionMachineFormSchema.parse(validInput(arburg))
        expect(buildProductionMachinePayload(parsed).maxDaylightMm).toBe(550)

        const result = productionMachineFormSchema.safeParse(validInput({ ...arburg, maxMoldHeightMm: "550" }))
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["maxMoldHeightMm"])
    })
})
