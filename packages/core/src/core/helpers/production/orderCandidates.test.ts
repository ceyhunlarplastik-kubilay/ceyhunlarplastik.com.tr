import { describe, expect, it } from "vitest"

import { evaluateOrderCandidates, type CandidateMachine, type CandidateMold } from "./orderCandidates"
import { formatProductionDateTime, wallTimeToUtc } from "./productionTime"

const SIZE = "size-30x30"
const MON_SAT = [1, 2, 3, 4, 5, 6]

const machine = (overrides: Partial<CandidateMachine>): CandidateMachine => ({
    id: "m-01",
    code: "M-01",
    name: "Arburg 320 C",
    areaId: "p1",
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
    plannedEfficiencyPercent: 85,
    hourlyCost: 250,
    currency: "TRY",
    shiftPatternId: null,
    ...overrides,
})

const k1001: CandidateMold = {
    id: "k-1001",
    code: "K-1001",
    name: "Kare tapa 8 göz",
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
    standardCycleTimeSec: 18,
    expectedScrapPercent: 1.5,
    setupMinutes: 45,
    outputs: [{ productSizeId: SIZE, cavities: 8, partWeightG: 3.6 }],
    machineProfiles: [{ machineId: "m-01", isPreferred: true, isBlocked: false, cycleTimeSec: 17.5, setupMinutes: 40 }],
}

const patterns = [
    { id: "p12", isDefault: true, timezone: "Europe/Istanbul", shifts: [{ code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 720, daysOfWeek: MON_SAT, sortOrder: 0 }] },
    {
        id: "p24",
        isDefault: false,
        timezone: "Europe/Istanbul",
        shifts: [
            { code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 },
            { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 1 },
            { code: "C", name: "Gece", startMinute: 0, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 2 },
        ],
    },
]

const now = wallTimeToUtc("2026-10-05T08:00")!

const evaluate = (overrides: { dueDate?: string | null; machines?: CandidateMachine[] } = {}) => evaluateOrderCandidates({
    order: { quantity: 100_000, dueDate: overrides.dueDate ?? null, cycleTimeOverrideSec: null, productSizeId: SIZE },
    molds: [k1001],
    machines: overrides.machines ?? [
        machine({}),
        machine({ id: "m-02", code: "M-02", name: "Dizlili 120", clampForceTon: 120, tieBarHorizontalMm: 410, tieBarVerticalMm: 410, maxDaylightMm: null, maxMoldHeightMm: 480, maxOpeningStrokeMm: 390, shotCapacityG: 185, shiftPatternId: "p24", hourlyCost: 420 }),
        machine({ id: "m-03", code: "M-03", name: "Küçük", clampForceTon: 25 }),
    ],
    patterns,
    areaShiftPatternIds: { p1: null },
    exceptions: [],
    downtimes: [],
    materialFactor: null,
    now,
})

describe("evaluateOrderCandidates", () => {
    it("uygun olmayan makine aday olmaz; çevrim kart > kalıp", () => {
        const { candidates, excluded } = evaluate()

        expect(excluded).toEqual([{ machineCode: "M-03", moldCode: "K-1001", reasons: [expect.stringContaining("Gerekli 30 t")] }])
        const m01 = candidates.find((candidate) => candidate.machine.code === "M-01")!
        expect(m01).toMatchObject({ cycleTimeSec: 17.5, cycleSource: "machineCard", shots: 12_691, setupMinutes: 40, isPreferred: true })
        const m02 = candidates.find((candidate) => candidate.machine.code === "M-02")!
        expect(m02).toMatchObject({ cycleTimeSec: 18, cycleSource: "mold", setupMinutes: 45 })
    })

    it("24 saat çalışan makine önce biter; 12 saatlik düzen günlere yayılır; lotlar vardiya başına", () => {
        const { candidates } = evaluate()

        expect(candidates.map((candidate) => candidate.machine.code)).toEqual(["M-02", "M-01"])
        expect(candidates[0].isEarliest).toBe(true)
        const m01 = candidates[1]
        // 40 dk bağlama + ≈4.355 dk üretim; günde 12 saat → 7 vardiya (Pzt–Cmt, Pazar çalışılmaz).
        expect(m01.lots).toHaveLength(7)
        expect(m01.lots.reduce((sum, lot) => sum + lot.shots, 0)).toBe(12_691)
        expect(formatProductionDateTime(m01.endAt!).slice(0, 10)).toBe("12.10.2026")
    })

    it("termin ve maliyet: yetişemeyen aday en ucuz sayılmaz", () => {
        const { candidates } = evaluate({ dueDate: "2026-10-09" })
        const m01 = candidates.find((candidate) => candidate.machine.code === "M-01")!
        const m02 = candidates.find((candidate) => candidate.machine.code === "M-02")!

        expect(m01.meetsDueDate).toBe(false)
        expect(m02.meetsDueDate).toBe(true)
        expect(m02.isCheapest).toBe(true)
        expect(m01.machineCost).toBeCloseTo(((40 + m01.productionMinutes) / 60) * 250, 1)
    })

    it("mevcut iş makineyi ve kalıbı meşgul eder; yeni iş sonrasına yerleşir", () => {
        const busyUntil = wallTimeToUtc("2026-10-07T08:00")!
        const { candidates } = evaluateOrderCandidates({
            order: { quantity: 1000, dueDate: null, cycleTimeOverrideSec: null, productSizeId: SIZE },
            molds: [k1001],
            machines: [machine({ id: "m-02", code: "M-02", shiftPatternId: "p24", clampForceTon: 120, tieBarHorizontalMm: 410, tieBarVerticalMm: 410, maxDaylightMm: null, maxMoldHeightMm: 480, maxOpeningStrokeMm: 390, shotCapacityG: 185 })],
            patterns,
            areaShiftPatternIds: {},
            exceptions: [],
            downtimes: [],
            // Aynı kalıp başka makinede 7 Ekim 08:00'e kadar çalışıyor.
            busy: [{ machineId: "m-09", moldId: "k-1001", startAt: now, endAt: busyUntil }],
            materialFactor: null,
            now,
        })
        expect(formatProductionDateTime(candidates[0].setupStartAt!)).toBe("07.10.2026 08:00")
    })

    it("en erken başlangıç (tahtada taşıma): o andan sonraki ilk vardiyaya yerleşir; geçmiş an yok sayılır", () => {
        const base = {
            order: { quantity: 1000, dueDate: null, cycleTimeOverrideSec: null, productSizeId: SIZE },
            molds: [k1001],
            machines: [machine({})],
            patterns,
            areaShiftPatternIds: { p1: null },
            exceptions: [],
            downtimes: [],
            materialFactor: null,
            now,
        }
        // 12 saatlik düzen 08:00–20:00; Salı 21:00 bırakılan iş Çarşamba 08:00'de başlar.
        const later = evaluateOrderCandidates({ ...base, earliestStart: wallTimeToUtc("2026-10-06T21:00")! })
        expect(formatProductionDateTime(later.candidates[0].setupStartAt!)).toBe("07.10.2026 08:00")

        const past = evaluateOrderCandidates({ ...base, earliestStart: wallTimeToUtc("2026-10-01T08:00")! })
        expect(past.candidates[0].setupStartAt).toEqual(now)
    })

    it("vardiya düzeni yoksa plan kurulamaz ama aday gerekçesiyle görünür", () => {
        const { candidates } = evaluateOrderCandidates({
            order: { quantity: 1000, dueDate: null, cycleTimeOverrideSec: 16, productSizeId: SIZE },
            molds: [k1001],
            machines: [machine({})],
            patterns: [],
            areaShiftPatternIds: {},
            exceptions: [],
            downtimes: [],
            materialFactor: null,
            now,
        })
        expect(candidates[0]).toMatchObject({ missingShiftPattern: true, endAt: null, cycleSource: "order", cycleTimeSec: 16 })
    })
})
