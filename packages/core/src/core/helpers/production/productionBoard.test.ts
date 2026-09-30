import { describe, expect, it } from "vitest"

import { bestCompatibilityVerdict, boardRangeInstants, buildBoardMachineCalendars, findBoardRangeIssue, MAX_BOARD_DAYS } from "./productionBoard"

const MON_SAT = [1, 2, 3, 4, 5, 6]
const pattern = {
    id: "p3x8",
    name: "3×8",
    isDefault: true,
    timezone: "Europe/Istanbul",
    shifts: [
        { code: "A", name: "Sabah", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 },
        { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 1 },
        { code: "C", name: "Gece", startMinute: 1440, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 2 },
    ],
}

describe("findBoardRangeIssue", () => {
    it("biçim, sıra ve üst sınır", () => {
        expect(findBoardRangeIssue("2026-09-28", "2026-10-04")).toBeNull()
        expect(findBoardRangeIssue("2026-09-28", "2026-09-28")).toBeNull()
        expect(findBoardRangeIssue("2026-9-28", "2026-10-04")).toMatch(/biçim/)
        expect(findBoardRangeIssue("2026-10-04", "2026-09-28")).toMatch(/önce/)
        expect(findBoardRangeIssue("2026-09-01", "2026-10-31")).toContain(String(MAX_BOARD_DAYS))
    })
})

describe("boardRangeInstants", () => {
    it("fabrika saatinde gün başı → ertesi gün başı", () => {
        const { start, end } = boardRangeInstants("2026-09-28", "2026-09-29")
        expect(start.toISOString()).toBe("2026-09-27T21:00:00.000Z")
        expect(end.toISOString()).toBe("2026-09-29T21:00:00.000Z")
    })
})

describe("buildBoardMachineCalendars", () => {
    const base = {
        patterns: [pattern],
        areaShiftPatternIds: { a1: null },
        from: "2026-09-28", // Pazartesi
        to: "2026-09-28",
    }

    it("varsayılan düzenle günün vardiyaları; önceki günün gece vardiyası pencerede kalır", () => {
        const [calendar] = buildBoardMachineCalendars({
            ...base,
            machines: [{ id: "m1", areaId: "a1", shiftPatternId: null }],
            exceptions: [],
        })
        expect(calendar.shiftPatternName).toBe("3×8")
        // Pazar gece vardiyası yok (Pazar çalışılmıyor); Pazartesi A, B ve C'nin ilk 00:00'a kadar olan kısmı değil —
        // C Pazartesi günü 24:00'te başlar, pencere Salı 00:00'da biter → yalnız A ve B.
        expect(calendar.shifts.map((shift) => shift.shiftCode)).toEqual(["A", "B"])
        expect(calendar.dayExceptions).toEqual([])
    })

    it("makine istisnası fabrika istisnasını ezer; düzeni olmayan makinede vardiya yok", () => {
        const calendars = buildBoardMachineCalendars({
            ...base,
            patterns: [{ ...pattern, isDefault: false }],
            areaShiftPatternIds: { a1: "p3x8", a2: null },
            machines: [
                { id: "m1", areaId: "a1", shiftPatternId: null },
                { id: "m2", areaId: "a2", shiftPatternId: null },
            ],
            exceptions: [
                { date: "2026-09-28", kind: "HOLIDAY", areaId: null, machineId: null },
                { date: "2026-09-28", kind: "EXTRA_WORKDAY", areaId: null, machineId: "m1" },
            ],
        })
        expect(calendars[0].dayExceptions).toEqual([{ date: "2026-09-28", kind: "EXTRA_WORKDAY" }])
        expect(calendars[0].shifts).toHaveLength(2)
        expect(calendars[1]).toMatchObject({ shiftPatternId: null, shifts: [], dayExceptions: [{ date: "2026-09-28", kind: "HOLIDAY" }] })
    })
})

describe("bestCompatibilityVerdict", () => {
    it("bir kalıp uyuyorsa uygun; hiç kalıp yoksa hata", () => {
        expect(bestCompatibilityVerdict(["error", "warning", "ok"])).toBe("ok")
        expect(bestCompatibilityVerdict(["error", "unknown"])).toBe("unknown")
        expect(bestCompatibilityVerdict([])).toBe("error")
    })
})
