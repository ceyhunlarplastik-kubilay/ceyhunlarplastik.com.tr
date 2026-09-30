import { describe, expect, it } from "vitest"

import {
    addDaysToDateKey,
    calendarExceptionScopeKey,
    enumerateDateKeys,
    findCalendarExceptionIssues,
    formatDateKeyList,
    formatDateKeyRange,
    groupCalendarExceptionDays,
    isValidDateKey,
    MAX_CALENDAR_EXCEPTION_DAYS,
    weekdayOfDateKey,
    type CalendarExceptionDay,
} from "./productionCalendar"

const AREA = "area-1"
const MACHINE = "machine-1"

const day = (
    id: string,
    date: string,
    overrides: Partial<CalendarExceptionDay> = {},
): CalendarExceptionDay => ({
    id,
    date,
    kind: "HOLIDAY",
    note: "Kurban Bayramı",
    areaId: null,
    machineId: null,
    ...overrides,
})

describe("gün anahtarları", () => {
    it("geçerli tarihi tanır", () => {
        expect(isValidDateKey("2026-02-28")).toBe(true)
        expect(isValidDateKey("2026-02-30")).toBe(false)
        expect(isValidDateKey("2026-2-3")).toBe(false)
    })

    it("aralığı ay ve yıl sınırından geçerek günlere açar", () => {
        expect(enumerateDateKeys("2026-12-30", "2027-01-02")).toEqual([
            "2026-12-30",
            "2026-12-31",
            "2027-01-01",
            "2027-01-02",
        ])
        expect(enumerateDateKeys("2026-05-26", "2026-05-26")).toEqual(["2026-05-26"])
        expect(enumerateDateKeys("2026-05-27", "2026-05-26")).toEqual([])
    })

    it("haftanın gününü vardiya düzeniyle aynı numaralar (1 = Pazartesi)", () => {
        expect(weekdayOfDateKey("2026-09-25")).toBe(5)
        expect(weekdayOfDateKey("2026-09-27")).toBe(7)
    })

    it("tarihleri okunur yazar", () => {
        expect(formatDateKeyRange("2026-05-26", "2026-05-26")).toBe("26.05.2026")
        expect(formatDateKeyRange("2026-05-26", "2026-05-30")).toBe("26.05.2026 – 30.05.2026")
        expect(formatDateKeyList(["2026-05-28", "2026-05-26"])).toBe("26.05.2026, 28.05.2026")
        expect(formatDateKeyList(enumerateDateKeys("2026-05-01", "2026-05-07"))).toBe(
            "01.05.2026, 02.05.2026, 03.05.2026, 04.05.2026, 05.05.2026 ve 2 gün daha",
        )
    })
})

describe("findCalendarExceptionIssues", () => {
    it("bitişi boş tek günlük kaydı kabul eder", () => {
        expect(findCalendarExceptionIssues({ startDate: "2026-10-29" })).toEqual([])
    })

    it("bitişin başlangıçtan önce olmasını reddeder", () => {
        const codes = findCalendarExceptionIssues({ startDate: "2026-05-30", endDate: "2026-05-26" }).map((issue) => issue.code)
        expect(codes).toEqual(["END_BEFORE_START"])
    })

    it(`en fazla ${MAX_CALENDAR_EXCEPTION_DAYS} güne izin verir`, () => {
        const startDate = "2026-01-01"
        const longest = addDaysToDateKey(startDate, MAX_CALENDAR_EXCEPTION_DAYS - 1)

        expect(findCalendarExceptionIssues({ startDate, endDate: longest })).toEqual([])
        expect(
            findCalendarExceptionIssues({ startDate, endDate: addDaysToDateKey(longest, 1) }).map((issue) => issue.code),
        ).toEqual(["TOO_LONG"])
    })

    it("alan ve makine birlikte seçilemez; geçersiz tarih yakalanır", () => {
        const codes = findCalendarExceptionIssues({ startDate: "2026-02-30", areaId: AREA, machineId: MACHINE })
            .map((issue) => issue.code)
        expect(codes).toEqual(["AMBIGUOUS_SCOPE", "INVALID_START"])
    })
})

describe("groupCalendarExceptionDays", () => {
    it("ardışık aynı kayıtları birleştirir; boşluk, kapsam ve not ayırır", () => {
        const groups = groupCalendarExceptionDays([
            day("d28", "2026-05-28"),
            day("d26", "2026-05-26"),
            day("a27", "2026-05-27", { kind: "EXTRA_WORKDAY", note: null, areaId: AREA }),
            day("d27", "2026-05-27"),
            day("d30", "2026-05-30"),
            day("m26", "2026-05-26", { note: "Kalıp değişimi", machineId: MACHINE }),
        ])

        expect(groups.map((group) => ({
            scope: calendarExceptionScopeKey(group),
            startDate: group.startDate,
            endDate: group.endDate,
            dayCount: group.dayCount,
            ids: group.ids,
        }))).toEqual([
            { scope: "factory", startDate: "2026-05-26", endDate: "2026-05-28", dayCount: 3, ids: ["d26", "d27", "d28"] },
            { scope: `machine:${MACHINE}`, startDate: "2026-05-26", endDate: "2026-05-26", dayCount: 1, ids: ["m26"] },
            { scope: `area:${AREA}`, startDate: "2026-05-27", endDate: "2026-05-27", dayCount: 1, ids: ["a27"] },
            { scope: "factory", startDate: "2026-05-30", endDate: "2026-05-30", dayCount: 1, ids: ["d30"] },
        ])
    })

    it("aynı günlerde farklı not ayrı satırdır", () => {
        const groups = groupCalendarExceptionDays([
            day("a", "2026-01-01", { note: "Yılbaşı" }),
            day("b", "2026-01-02", { note: "Köprü izni", kind: "SHUTDOWN" }),
        ])
        expect(groups).toHaveLength(2)
    })
})
