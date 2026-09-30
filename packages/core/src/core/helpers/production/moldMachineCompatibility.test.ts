import { describe, expect, it } from "vitest"

import {
    evaluateMoldMachineCompatibility,
    recommendMachineForMold,
    type CompatibilityMachineInput,
    type CompatibilityMoldInput,
    type CompatibilityResult,
} from "./moldMachineCompatibility"

/** Arburg ALLROUNDER 320 C GOLDEN EDITION (resmî föy): hidrolik kapama, açıklık 550. */
const arburg: CompatibilityMachineInput = {
    id: "m-01",
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
}

/** Dizlili kapama: strok kalınlıktan bağımsız, açıklık girilmez. */
const toggle: CompatibilityMachineInput = {
    ...arburg,
    id: "m-02",
    clampForceTon: 120,
    tieBarHorizontalMm: 410,
    tieBarVerticalMm: 410,
    minMoldHeightMm: 150,
    maxMoldHeightMm: 480,
    maxOpeningStrokeMm: 390,
    maxDaylightMm: null,
    shotCapacityG: 185,
    locatingRingDiameterMm: 100,
    hasRobot: false,
}

/** K-1001 · Kare profil tapası 30×30 · 8 göz. */
const k1001: CompatibilityMoldInput = {
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
    outputs: [{ cavities: 8, partWeightG: 3.6 }],
    machineProfiles: [],
}

const evaluate = (overrides: Partial<CompatibilityMoldInput>, machine: CompatibilityMachineInput = arburg) =>
    evaluateMoldMachineCompatibility({ ...k1001, ...overrides }, machine)

const levelOf = (result: CompatibilityResult, code: string) => result.checks.find((entry) => entry.code === code)?.level

describe("evaluateMoldMachineCompatibility", () => {
    it("K-1001 M-01'de uygun; açılma plaka açıklığından hesaplanır", () => {
        const result = evaluate({})

        expect(result.verdict).toBe("ok")
        expect(result.clampUtilization).toBeCloseTo(0.6)
        expect(result.shotWeightG).toBe(34.4)
        expect(result.shotUtilization).toBeCloseTo(34.4 / 65)
        expect(result.availableOpeningMm).toBe(324)
        expect(result.checks.find((entry) => entry.code === "OPENING_STROKE")?.message)
            .toBe("Gerekli 150 mm, kullanılabilir 324 mm (açıklık 550 − kalınlık 226).")
    })

    it("tonaj yetmezse uygun değil (K-9001)", () => {
        const result = evaluate({ requiredClampForceTon: 65 })
        expect(result.verdict).toBe("error")
        expect(levelOf(result, "CLAMP_FORCE")).toBe("error")
    })

    it("kolonlar: bir yönde geçmesi yeter; iki yönde de geçmezse uygun değil (K-9002)", () => {
        expect(levelOf(evaluate({ widthMm: 346, heightMm: 296 }), "TIE_BARS")).toBe("ok")
        expect(levelOf(evaluate({ widthMm: 346, heightMm: 346 }), "TIE_BARS")).toBe("error")
        expect(levelOf(evaluate({ widthMm: 346, heightMm: null }), "TIE_BARS")).toBe("unknown")
    })

    it("kalınlık: ince kalıp ara plaka ister (K-9005), açıklık kadar kalın kalıp açılamaz", () => {
        expect(evaluate({ thicknessMm: 176 }).checks.find((entry) => entry.code === "MOLD_THICKNESS")?.message)
            .toContain("ara plaka")
        expect(levelOf(evaluate({ thicknessMm: 550 }), "MOLD_THICKNESS")).toBe("error")
    })

    it("açılma hidrolik kapamada kalınlıkla azalır, dizlide azalmaz (K-9006)", () => {
        const thick = { thicknessMm: 320, requiredOpeningStrokeMm: 260 }

        expect(evaluate(thick).availableOpeningMm).toBe(230)
        expect(levelOf(evaluate(thick), "OPENING_STROKE")).toBe("error")
        expect(levelOf(evaluate({ ...thick, locatingRingDiameterMm: 100 }, toggle), "OPENING_STROKE")).toBe("ok")
    })

    it("baskı ağırlığı: kapasite aşımı hata (K-9003), %20–80 dışı dikkat, eksik parça ağırlığı doğrulanamadı", () => {
        expect(levelOf(evaluate({ outputs: [{ cavities: 4, partWeightG: 16 }], runnerWeightG: 8 }), "SHOT_WEIGHT")).toBe("error")
        expect(levelOf(evaluate({ outputs: [{ cavities: 4, partWeightG: 13 }], runnerWeightG: 8 }), "SHOT_WEIGHT")).toBe("warning")
        expect(levelOf(evaluate({ outputs: [{ cavities: 1, partWeightG: 6 }], runnerWeightG: 2 }), "SHOT_WEIGHT")).toBe("warning")
        expect(levelOf(evaluate({ outputs: [{ cavities: 4, partWeightG: null }] }), "SHOT_WEIGHT")).toBe("unknown")
        expect(levelOf(evaluate({ outputs: [] }), "SHOT_WEIGHT")).toBe("unknown")
    })

    it("donanım: sıcak yolluk eksiği dikkat, maça ve robot eksiği hata, bilezik farkı dikkat (K-9004, K-9007)", () => {
        const hotRunner = evaluate({ hotRunnerZones: 2 })
        expect(levelOf(hotRunner, "HOT_RUNNER")).toBe("warning")
        expect(hotRunner.verdict).toBe("warning")

        expect(levelOf(evaluate({ coreCircuitsRequired: 2 }), "CORE_PULL")).toBe("error")
        expect(levelOf(evaluate({ requiresRobot: true, locatingRingDiameterMm: 100 }, toggle), "ROBOT")).toBe("error")
        expect(levelOf(evaluate({ locatingRingDiameterMm: 100 }), "LOCATING_RING")).toBe("warning")
        // Bilezik bilinmiyorsa kontrol yapılmaz; hükmü düşürmez.
        expect(evaluate({ locatingRingDiameterMm: null }).verdict).toBe("ok")
    })

    it("kalıp kartı ve durumlar: engel ve kullanım dışı hata, bakım dikkat", () => {
        const blocked = evaluate({ machineProfiles: [{ machineId: arburg.id, isPreferred: true, isBlocked: true }] })
        expect(blocked.verdict).toBe("error")
        expect(blocked.isPreferred).toBe(false)

        expect(evaluate({ machineProfiles: [{ machineId: arburg.id, isPreferred: true, isBlocked: false }] }).isPreferred).toBe(true)
        expect(evaluate({}, { ...arburg, status: "MAINTENANCE" }).verdict).toBe("warning")
        expect(evaluate({}, { ...arburg, status: "INACTIVE" }).verdict).toBe("error")
        expect(evaluate({ status: "RETIRED" }).verdict).toBe("error")
    })

    it("eksik veri planı kilitlemez: doğrulanamadı olarak döner", () => {
        const result = evaluate({
            requiredClampForceTon: null,
            widthMm: null,
            heightMm: null,
            thicknessMm: null,
            requiredOpeningStrokeMm: null,
            locatingRingDiameterMm: null,
            outputs: [],
        })

        expect(result.verdict).toBe("unknown")
        expect(result.checks.every((entry) => entry.level === "unknown")).toBe(true)
    })
})

describe("recommendMachineForMold", () => {
    const small = { ...arburg, id: "m-35", code: "M-35", clampForceTon: 35 }
    const medium = { ...arburg, id: "m-01", code: "M-01" }
    const large = { ...toggle, id: "m-120", code: "M-120" }
    const entry = (machine: typeof medium, overrides: Partial<CompatibilityResult>) => ({
        machine,
        result: { ...evaluate({}, machine), ...overrides },
    })

    it("uygunlar arasında en küçük yeterli presi seçer; ✓ olan ⚠ olandan önce gelir", () => {
        expect(recommendMachineForMold([
            entry(large, { verdict: "ok" }),
            entry(medium, { verdict: "ok" }),
            entry(small, { verdict: "warning" }),
        ])).toBe("m-01")
    })

    it("kalıp kartında tercih edilen uygun makine önce gelir", () => {
        expect(recommendMachineForMold([
            entry(medium, { verdict: "ok" }),
            entry(large, { verdict: "warning", isPreferred: true }),
        ])).toBe("m-120")
    })

    it("doğrulanamayan ve uygun olmayan makine önerilmez", () => {
        expect(recommendMachineForMold([
            entry(medium, { verdict: "unknown" }),
            entry(large, { verdict: "error" }),
        ])).toBeNull()
    })
})
