import { describe, expect, it } from "vitest"

import {
    computeProductionMinutes,
    computeShotCount,
    resolveCycleTimeSec,
    scheduleForward,
    splitIntoShiftLots,
} from "./jobScheduling"
import { buildWorkingWindows } from "./shiftCalendar"
import { formatProductionDateTime, wallTimeToUtc } from "./productionTime"

const wall = (value: string) => wallTimeToUtc(value)!

describe("çevrim zinciri", () => {
    it("emir > makine kartı > varyant > kalıp × hammadde katsayısı", () => {
        expect(resolveCycleTimeSec({ orderOverrideSec: 16, machineCardSec: 17.5, variantSec: 19, moldStandardSec: 18 })).toEqual({ cycleTimeSec: 16, source: "order" })
        expect(resolveCycleTimeSec({ machineCardSec: 17.5, variantSec: 19, moldStandardSec: 18 })).toEqual({ cycleTimeSec: 17.5, source: "machineCard" })
        // Varyant çevrimi hammadde katsayısıyla ÇARPILMAZ; boş / 0 ise atlanır.
        expect(resolveCycleTimeSec({ variantSec: 19, moldStandardSec: 18, materialFactor: 1.2 })).toEqual({ cycleTimeSec: 19, source: "variant" })
        expect(resolveCycleTimeSec({ variantSec: null, moldStandardSec: 18 })).toEqual({ cycleTimeSec: 18, source: "mold" })
        expect(resolveCycleTimeSec({ moldStandardSec: 18, materialFactor: 1.2 })).toEqual({ cycleTimeSec: 21.6, source: "mold" })
    })
})

describe("baskı ve süre (doküman örneği)", () => {
    it("100.000 tapa, 8 göz, %1,5 fire, 17,5 sn, %85 verim", () => {
        const shots = computeShotCount({ quantity: 100_000, cavities: 8, scrapPercent: 1.5 })
        expect(shots).toBe(12_691)
        expect(computeProductionMinutes({ shots, cycleTimeSec: 17.5, efficiencyPercent: 85 })).toBeCloseTo(4354.6, 0)
    })

    it("10.000 adet, 4 göz, 20 sn, %85 → 2.500 baskı ≈ 16,3 saat", () => {
        const shots = computeShotCount({ quantity: 10_000, cavities: 4, scrapPercent: 0 })
        expect(shots).toBe(2500)
        expect(computeProductionMinutes({ shots, cycleTimeSec: 20, efficiencyPercent: 85 }) / 60).toBeCloseTo(16.34, 2)
    })
})

describe("ileri planlama ve vardiya lotları", () => {
    const threeShifts = [
        { code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 480, daysOfWeek: [1, 2, 3, 4, 5, 6], sortOrder: 0 },
        { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: [1, 2, 3, 4, 5, 6], sortOrder: 1 },
        { code: "C", name: "Gece", startMinute: 0, durationMinutes: 480, daysOfWeek: [1, 2, 3, 4, 5, 6], sortOrder: 2 },
    ]

    it("doküman örneği: 3×8 düzeninde 08:00'de başlayan 17,1 saatlik iş üç lota bölünür", () => {
        const windows = buildWorkingWindows({
            shifts: threeShifts,
            from: wall("2026-10-01T08:00"),
            to: wall("2026-10-10T08:00"),
            exceptions: [],
            downtimes: [],
            machineId: "m",
            areaId: null,
        })
        const productionMinutes = computeProductionMinutes({ shots: 2500, cycleTimeSec: 20, efficiencyPercent: 85 })
        const schedule = scheduleForward({ windows, earliestStart: wall("2026-10-01T08:00"), setupMinutes: 45, productionMinutes })

        expect(schedule).not.toBeNull()
        expect(formatProductionDateTime(schedule!.productionStartAt)).toBe("01.10.2026 08:45")
        expect(formatProductionDateTime(schedule!.endAt)).toBe("02.10.2026 01:05")

        const lots = splitIntoShiftLots({ segments: schedule!.segments, totalShots: 2500, cavities: 4 })
        expect(lots.map((lot) => `${lot.sequence} ${lot.shiftCode}`)).toEqual(["1 A", "2 B", "3 C"])
        expect(lots.reduce((sum, lot) => sum + lot.shots, 0)).toBe(2500)
        expect(lots.map((lot) => lot.quantity)).toEqual(lots.map((lot) => lot.shots * 4))
    })

    it("pencere yetmezse null döner", () => {
        const windows = buildWorkingWindows({
            shifts: threeShifts.slice(0, 1),
            from: wall("2026-10-01T08:00"),
            to: wall("2026-10-01T20:00"),
            exceptions: [],
            downtimes: [],
            machineId: "m",
            areaId: null,
        })
        expect(scheduleForward({ windows, earliestStart: wall("2026-10-01T08:00"), setupMinutes: 60, productionMinutes: 600 })).toBeNull()
    })
})
