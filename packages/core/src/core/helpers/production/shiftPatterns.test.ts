import { describe, expect, it } from "vitest"

import {
    buildShiftTimeline,
    describeWeekdays,
    findShiftPatternIssues,
    formatMinuteOfDay,
    formatShiftRange,
    normalizeShiftDefinitions,
    parseMinuteOfDay,
    resolveEffectiveShiftPattern,
    SHIFT_PATTERN_PRESETS,
    summarizeShiftPattern,
    type ShiftDefinitionInput,
} from "./shiftPatterns"

const shift = (
    code: string,
    startHour: number,
    durationHours: number,
    daysOfWeek: number[] = [1, 2, 3, 4, 5],
): ShiftDefinitionInput => ({
    code,
    name: `Vardiya ${code}`,
    startMinute: startHour * 60,
    durationMinutes: durationHours * 60,
    daysOfWeek,
})

describe("SHIFT_PATTERN_PRESETS", () => {
    it("her hazır şablon geçerli ve etiketindeki günlük saati veriyor", () => {
        for (const preset of SHIFT_PATTERN_PRESETS) {
            const shifts = normalizeShiftDefinitions(preset.shifts)

            expect(findShiftPatternIssues(shifts)).toEqual([])
            expect(summarizeShiftPattern(shifts).maxDailyMinutes).toBe(preset.dailyHours * 60)
        }
    })
})

describe("buildShiftTimeline — vardiya günü", () => {
    it("ilk vardiyadan önce başlayan vardiyayı ertesi güne yerleştirir (gece vardiyası)", () => {
        const timeline = buildShiftTimeline(normalizeShiftDefinitions([
            shift("A", 8, 8),
            shift("B", 16, 8),
            shift("C", 0, 8),
        ]))

        expect(timeline.map((entry) => [entry.shift.code, entry.offsetStart, entry.startsNextDay])).toEqual([
            ["A", 0, false],
            ["B", 480, false],
            ["C", 960, true],
        ])
    })

    it("gece yarısını geçen vardiya ertesi güne BAŞLAMAZ, yalnız taşar", () => {
        const [a, b] = buildShiftTimeline(normalizeShiftDefinitions([shift("A", 8, 12), shift("B", 20, 12)]))

        expect(a.startsNextDay).toBe(false)
        expect(b.startsNextDay).toBe(false)
        expect(b.offsetEnd).toBe(1440)
    })
})

describe("findShiftPatternIssues", () => {
    it("örtüşen vardiyaları yakalar", () => {
        const issues = findShiftPatternIssues(normalizeShiftDefinitions([shift("A", 8, 10), shift("B", 16, 8)]))

        expect(issues.map((issue) => issue.code)).toEqual(["OVERLAP"])
    })

    it("24 saati aşan vardiya gününü yakalar", () => {
        // A 08:00 + B 16:00 (8 sa) + C 00:00 (10 sa) → C ertesi günün A'sına taşar.
        const issues = findShiftPatternIssues(normalizeShiftDefinitions([
            shift("A", 8, 8),
            shift("B", 16, 8),
            shift("C", 0, 10),
        ]))

        expect(issues.map((issue) => issue.code)).toEqual(["EXCEEDS_DAY"])
    })

    it("kodu büyük harfe çevirip tekrarı yakalar; boş gün ve geçersiz süreyi bildirir", () => {
        const issues = findShiftPatternIssues(normalizeShiftDefinitions([
            shift("a", 8, 8),
            { ...shift("A", 16, 8), daysOfWeek: [] },
            { ...shift("B", 0, 8), durationMinutes: 10 },
        ]))

        expect(issues.map((issue) => issue.code)).toEqual(["DUPLICATE_CODE", "NO_DAYS", "INVALID_DURATION"])
    })

    it("boş listeyi reddeder", () => {
        expect(findShiftPatternIssues([]).map((issue) => issue.code)).toEqual(["NO_SHIFTS"])
    })
})

describe("summarizeShiftPattern", () => {
    it("günlük süreyi o gün çalışan vardiyalardan hesaplar (Cumartesi yalnız gündüz)", () => {
        const summary = summarizeShiftPattern(normalizeShiftDefinitions([
            shift("A", 8, 8, [1, 2, 3, 4, 5, 6]),
            shift("B", 16, 8, [1, 2, 3, 4, 5]),
        ]))

        expect(summary.minutesByWeekday[1]).toBe(16 * 60)
        expect(summary.minutesByWeekday[6]).toBe(8 * 60)
        expect(summary.minutesByWeekday[7]).toBe(0)
        expect(summary.workingWeekdays).toEqual([1, 2, 3, 4, 5, 6])
        expect(summary.weeklyMinutes).toBe(5 * 16 * 60 + 8 * 60)
    })
})

describe("biçimlendirme", () => {
    it("dakika ↔ saat dönüşümü", () => {
        expect(formatMinuteOfDay(480)).toBe("08:00")
        expect(formatMinuteOfDay(1440)).toBe("24:00")
        expect(parseMinuteOfDay("8:30")).toBe(510)
        expect(parseMinuteOfDay("24:00")).toBeNull()
        expect(parseMinuteOfDay("ab")).toBeNull()
    })

    it("vardiya aralığı gece yarısını geçince ertesi gün saatini gösterir", () => {
        expect(formatShiftRange({ startMinute: 1200, durationMinutes: 720 })).toBe("20:00–08:00")
        expect(formatShiftRange({ startMinute: 480, durationMinutes: 1440 })).toBe("08:00–08:00")
    })

    it("gün listesini okunur yazar", () => {
        expect(describeWeekdays([1, 2, 3, 4, 5, 6])).toBe("Pzt–Cmt")
        expect(describeWeekdays([5, 1, 3])).toBe("Pzt, Çar, Cum")
        expect(describeWeekdays([1, 2, 3, 4, 5, 6, 7])).toBe("Her gün")
        expect(describeWeekdays([])).toBe("—")
    })
})

describe("resolveEffectiveShiftPattern", () => {
    it("makine → alan → varsayılan sırasıyla çözer", () => {
        expect(resolveEffectiveShiftPattern({ machineShiftPatternId: "m", areaShiftPatternId: "a", defaultShiftPatternId: "d" }))
            .toEqual({ patternId: "m", source: "machine" })
        expect(resolveEffectiveShiftPattern({ machineShiftPatternId: null, areaShiftPatternId: "a", defaultShiftPatternId: "d" }))
            .toEqual({ patternId: "a", source: "area" })
        expect(resolveEffectiveShiftPattern({ machineShiftPatternId: null, areaShiftPatternId: null, defaultShiftPatternId: "d" }))
            .toEqual({ patternId: "d", source: "default" })
        expect(resolveEffectiveShiftPattern({ machineShiftPatternId: null, areaShiftPatternId: null, defaultShiftPatternId: null }))
            .toEqual({ patternId: null, source: null })
    })
})
