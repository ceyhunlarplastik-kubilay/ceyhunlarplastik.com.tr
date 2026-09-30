import { describe, expect, it } from "vitest"

import { buildShiftInstances, buildWorkingWindows, resolveWorkdayException, subtractDowntimes } from "./shiftCalendar"
import { formatProductionDateTime, wallTimeToUtc } from "./productionTime"

const MON_SAT = [1, 2, 3, 4, 5, 6]
const oneShift12h = [{ code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 720, daysOfWeek: MON_SAT, sortOrder: 0 }]
const threeShifts = [
    { code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 },
    { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 1 },
    { code: "C", name: "Gece", startMinute: 0, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 2 },
]
const wall = (value: string) => wallTimeToUtc(value)!
const describeWindows = (windows: Array<{ workday: string; shiftCode: string; startAt: Date; endAt: Date }>) =>
    windows.map((window) => `${window.workday} ${window.shiftCode} ${formatProductionDateTime(window.startAt)} → ${formatProductionDateTime(window.endAt).slice(11)}`)

const scope = { machineId: "m-01", areaId: "p1" }

describe("resolveWorkdayException", () => {
    it("makine > alan > fabrika", () => {
        const exceptions = [
            { date: "2026-10-29", kind: "HOLIDAY" as const, areaId: null, machineId: null },
            { date: "2026-10-29", kind: "EXTRA_WORKDAY" as const, areaId: "p1", machineId: null },
        ]
        expect(resolveWorkdayException("2026-10-29", exceptions, scope)).toBe("EXTRA_WORKDAY")
        expect(resolveWorkdayException("2026-10-29", exceptions, { machineId: "m-02", areaId: "p2" })).toBe("HOLIDAY")
        expect(resolveWorkdayException("2026-10-30", exceptions, scope)).toBeNull()
    })
})

describe("buildShiftInstances", () => {
    it("12 saatlik düzen: Pazar çalışılmaz, saatler fabrika saatiyle", () => {
        const windows = buildShiftInstances({ shifts: oneShift12h, fromWorkday: "2026-09-26", toWorkday: "2026-09-28", exceptions: [], ...scope })
        expect(describeWindows(windows)).toEqual([
            "2026-09-26 A 26.09.2026 08:00 → 20:00",
            "2026-09-28 A 28.09.2026 08:00 → 20:00",
        ])
    })

    it("gece vardiyası vardiya gününe aittir; o gün tatilse gece de çalışılmaz", () => {
        const windows = buildShiftInstances({
            shifts: threeShifts,
            fromWorkday: "2026-10-29",
            toWorkday: "2026-10-30",
            exceptions: [{ date: "2026-10-29", kind: "HOLIDAY", areaId: null, machineId: null }],
            ...scope,
        })
        expect(describeWindows(windows)).toEqual([
            "2026-10-30 A 30.10.2026 08:00 → 16:00",
            "2026-10-30 B 30.10.2026 16:00 → 00:00",
            "2026-10-30 C 31.10.2026 00:00 → 08:00",
        ])
    })

    it("ek mesai günü düzenin günlerine bakmadan çalışır", () => {
        const windows = buildShiftInstances({
            shifts: oneShift12h,
            fromWorkday: "2026-09-27",
            toWorkday: "2026-09-27",
            exceptions: [{ date: "2026-09-27", kind: "EXTRA_WORKDAY", areaId: null, machineId: "m-01" }],
            ...scope,
        })
        expect(windows).toHaveLength(1)
    })
})

describe("duruş ve pencere kırpma", () => {
    it("duruş pencereyi böler; başlangıç anı öncesi kırpılır", () => {
        const windows = buildWorkingWindows({
            shifts: oneShift12h,
            from: wall("2026-09-28T10:00"),
            to: wall("2026-09-29T20:00"),
            exceptions: [],
            downtimes: [{ startAt: wall("2026-09-29T12:00"), endAt: wall("2026-09-29T14:00") }],
            ...scope,
        })
        expect(describeWindows(windows)).toEqual([
            "2026-09-28 A 28.09.2026 10:00 → 20:00",
            "2026-09-29 A 29.09.2026 08:00 → 12:00",
            "2026-09-29 A 29.09.2026 14:00 → 20:00",
        ])
    })

    it("pencereyi tamamen kaplayan duruş onu siler", () => {
        const window = { workday: "d", shiftCode: "A", shiftName: "", startAt: wall("2026-09-28T08:00"), endAt: wall("2026-09-28T20:00") }
        expect(subtractDowntimes([window], [{ startAt: wall("2026-09-28T07:00"), endAt: wall("2026-09-28T21:00") }])).toEqual([])
    })
})
