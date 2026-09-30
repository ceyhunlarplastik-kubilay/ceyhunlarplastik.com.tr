import { describe, expect, it } from "vitest"

import {
    buildRosterDay,
    findOperatorSelectionIssue,
    findRosterCopyIssue,
    MAX_ROSTER_COPY_DAYS,
    planRosterCopy,
} from "./shiftAssignments"

const MON_SAT = [1, 2, 3, 4, 5, 6]
const p3 = {
    id: "p3", name: "3×8", isDefault: true, timezone: "Europe/Istanbul",
    shifts: [
        { code: "A", name: "Sabah", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 },
        { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 1 },
        { code: "C", name: "Gece", startMinute: 1440, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 2 },
    ],
}
const p12 = {
    id: "p12", name: "12 saat", isDefault: false, timezone: "Europe/Istanbul",
    shifts: [{ code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 720, daysOfWeek: [1, 2, 3, 4, 5], sortOrder: 0 }],
}
const machines = [
    { id: "m1", areaId: "a1", shiftPatternId: null },
    { id: "m2", areaId: "a1", shiftPatternId: "p12" },
]

describe("buildRosterDay", () => {
    it("vardiya günündeki vardiyalar — gece vardiyası kırpılmadan o güne ait", () => {
        const [m1, m2] = buildRosterDay({ machines, areaShiftPatternIds: {}, patterns: [p3, p12], exceptions: [], date: "2026-09-28" })
        expect(m1.shifts.map((shift) => shift.code)).toEqual(["A", "B", "C"])
        // C: 29.09 00:00–08:00 (TR) = 28.09 21:00Z – 29.09 05:00Z
        expect(m1.shifts[2].startAt.toISOString()).toBe("2026-09-28T21:00:00.000Z")
        expect(m2).toMatchObject({ shiftPatternName: "12 saat", exception: null })
        expect(m2.shifts.map((shift) => shift.code)).toEqual(["A"])
    })

    it("Cumartesi 12 saatlik düzen çalışmaz; tatil günü vardiya yok ama istisna görünür", () => {
        const saturday = buildRosterDay({ machines, areaShiftPatternIds: {}, patterns: [p3, p12], exceptions: [], date: "2026-10-03" })
        expect(saturday[1].shifts).toEqual([])
        const holiday = buildRosterDay({
            machines, areaShiftPatternIds: {}, patterns: [p3, p12], date: "2026-09-28",
            exceptions: [{ date: "2026-09-28", kind: "HOLIDAY", areaId: null, machineId: null }],
        })
        expect(holiday.map((day) => [day.exception, day.shifts.length])).toEqual([["HOLIDAY", 0], ["HOLIDAY", 0]])
    })
})

describe("findOperatorSelectionIssue", () => {
    const operators = [
        { id: "ahmet", firstName: "Ahmet", lastName: "Yılmaz", isActive: true },
        { id: "veli", firstName: "Veli", lastName: "Kaya", isActive: false },
    ]
    const base = { operators, alreadySelectedIds: [], max: 2 }

    it("geçerli seçim; pasif operatör yalnız zaten seçiliyse kalır", () => {
        expect(findOperatorSelectionIssue({ ...base, operatorIds: ["ahmet"] })).toBeNull()
        expect(findOperatorSelectionIssue({ ...base, operatorIds: [] })).toBeNull()
        expect(findOperatorSelectionIssue({ ...base, operatorIds: ["veli"] })).toBe("Veli Kaya pasif; yeni atamada seçilemez.")
        expect(findOperatorSelectionIssue({ ...base, operatorIds: ["veli"], alreadySelectedIds: ["veli"] })).toBeNull()
    })

    it("tekrar, sınır ve bilinmeyen operatör", () => {
        expect(findOperatorSelectionIssue({ ...base, operatorIds: ["ahmet", "ahmet"] })).toContain("iki kez")
        expect(findOperatorSelectionIssue({ ...base, operatorIds: ["ahmet", "veli", "x"], alreadySelectedIds: ["veli"] })).toContain("En fazla 2")
        expect(findOperatorSelectionIssue({ ...base, operatorIds: ["x"] })).toContain("bulunamadı")
    })
})

describe("kopyalama", () => {
    it("aralık kuralları", () => {
        expect(findRosterCopyIssue({ fromDate: "2026-09-28", toStart: "2026-09-29", toEnd: "2026-10-03" })).toBeNull()
        expect(findRosterCopyIssue({ fromDate: "2026-09-28", toStart: "2026-09-27", toEnd: "2026-09-30" })).toContain("Kaynak gün")
        expect(findRosterCopyIssue({ fromDate: "2026-09-28", toStart: "2026-10-03", toEnd: "2026-09-29" })).toContain("önce")
        expect(findRosterCopyIssue({ fromDate: "2026-09-01", toStart: "2026-09-02", toEnd: "2026-12-01" })).toContain(String(MAX_ROSTER_COPY_DAYS))
        expect(findRosterCopyIssue({ fromDate: "28.09.2026", toStart: "2026-09-29", toEnd: "2026-09-30" })).toContain("biçiminde")
    })

    it("hedefte çalışılmayan hücre ve pasif operatör atlanır", () => {
        const tuesday = buildRosterDay({ machines, areaShiftPatternIds: {}, patterns: [p3, p12], exceptions: [], date: "2026-09-29" })
        const saturday = buildRosterDay({ machines, areaShiftPatternIds: {}, patterns: [p3, p12], exceptions: [], date: "2026-10-03" })
        const rows = planRosterCopy({
            source: [
                { machineId: "m1", shiftCode: "C", operatorId: "ahmet" },
                { machineId: "m2", shiftCode: "A", operatorId: "ahmet" },
                { machineId: "m1", shiftCode: "A", operatorId: "veli" },
            ],
            targetDays: [{ date: "2026-09-29", machines: tuesday }, { date: "2026-10-03", machines: saturday }],
            activeOperatorIds: new Set(["ahmet"]),
        })
        expect(rows).toEqual([
            { machineId: "m1", shiftDate: "2026-09-29", shiftCode: "C", operatorId: "ahmet" },
            { machineId: "m2", shiftDate: "2026-09-29", shiftCode: "A", operatorId: "ahmet" },
            // Cumartesi m2 (12 saat, Pzt–Cum) çalışmıyor → atlandı; m1 C çalışıyor.
            { machineId: "m1", shiftDate: "2026-10-03", shiftCode: "C", operatorId: "ahmet" },
        ])
    })
})
