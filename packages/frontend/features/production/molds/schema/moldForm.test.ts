import { describe, expect, it } from "vitest"

import { buildMoldPayload, createMoldFormDefaults, moldFormSchema } from "./moldForm"

const SIZE_A = "66666666-6666-4666-8666-666666666666"
const MACHINE_ID = "44444444-4444-4444-8444-444444444444"

function validInput(overrides: Record<string, unknown> = {}) {
    return {
        ...createMoldFormDefaults(),
        code: "K-1045",
        name: "Elcik kalıbı",
        standardCycleTimeSec: "22,5",
        outputs: [{ productId: "p", productSizeId: SIZE_A, cavities: "4", partWeightG: "12,4" }],
        ...overrides,
    }
}

describe("moldFormSchema", () => {
    it("metinleri sayıya çevirir, arayüz alanını (productId) payload'a koymaz", () => {
        const payload = buildMoldPayload(moldFormSchema.parse(validInput({ lastMaintenanceAt: "2026-09-01" })))

        expect(payload.standardCycleTimeSec).toBe(22.5)
        expect(payload.setupMinutes).toBe(60)
        expect(payload.outputs).toEqual([{ productSizeId: SIZE_A, cavities: 4, partWeightG: 12.4 }])
        expect(payload.lastMaintenanceAt).toBe("2026-09-01T00:00:00.000Z")
        expect(payload.requiredClampForceTon).toBeNull()
    })

    it("aynı ölçüyü iki kez ve tercih + engelli kartı sunucuyla aynı kuralla reddeder", () => {
        const duplicated = moldFormSchema.safeParse(validInput({
            outputs: [
                { productId: "p", productSizeId: SIZE_A, cavities: "2", partWeightG: "" },
                { productId: "p", productSizeId: SIZE_A, cavities: "2", partWeightG: "" },
            ],
        }))
        expect(duplicated.success).toBe(false)
        expect(duplicated.error?.issues.some((issue) => issue.path[0] === "outputs")).toBe(true)

        const conflicting = moldFormSchema.safeParse(validInput({
            machineProfiles: [{ machineId: MACHINE_ID, cycleTimeSec: "", setupMinutes: "", isPreferred: true, isBlocked: true, notes: "" }],
        }))
        expect(conflicting.success).toBe(false)
    })

    it("çevrim süresi zorunlu", () => {
        expect(moldFormSchema.safeParse(validInput({ standardCycleTimeSec: "" })).success).toBe(false)
    })
})
