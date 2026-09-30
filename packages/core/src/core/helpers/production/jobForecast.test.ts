import { describe, expect, it } from "vitest"

import {
    describeForecast,
    dueEndAtFor,
    forecastCalendarRange,
    forecastJob,
    forecastJobsOnMachines,
    forecastStartPoint,
    isForecastAlert,
    machineWindowsFrom,
    remainingShotsByMold,
    type ForecastJobInput,
    type ForecastLotInput,
} from "./jobForecast"
import { buildWorkingWindows } from "./shiftCalendar"

const at = (iso: string) => new Date(iso)
const MON_SAT = [1, 2, 3, 4, 5, 6]
// 3×8 (A 08:00, B 16:00, C 00:00 — TR), Pzt–Cmt
const shifts = [
    { code: "A", name: "Sabah", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 },
    { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 1 },
    { code: "C", name: "Gece", startMinute: 1440, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 2 },
]
const windowsFrom = (from: Date) => buildWorkingWindows({
    shifts, from, to: new Date(from.getTime() + 30 * 86_400_000), exceptions: [], downtimes: [], machineId: "m1", areaId: null,
})

// Pzt 05.01.2026 08:00 bağlama, 08:30 üretim; 3 lot × 1.000 baskı, 24 sn çevrim, %100 verim → 20 sa üretim
const job: ForecastJobInput = {
    status: "RUNNING",
    setupStartAt: at("2026-01-05T05:00:00Z"),
    productionStartAt: at("2026-01-05T05:30:00Z"),
    plannedEndAt: at("2026-01-06T01:30:00Z"),
    plannedShots: 3_000,
    cycleTimeSec: 24,
    efficiencyPercent: 100,
    setupMinutes: 30,
}
const lot = (overrides: Partial<ForecastLotInput> = {}): ForecastLotInput => ({
    status: "PLANNED", actualStartAt: null, actualEndAt: null, actualShots: null, reported: false, ...overrides,
})
const run = (overrides: { job?: Partial<ForecastJobInput>; lots?: ForecastLotInput[]; now?: Date; dueEndAt?: Date | null } = {}) => forecastJob({
    job: { ...job, ...overrides.job },
    lots: overrides.lots ?? [lot(), lot(), lot()],
    now: overrides.now ?? at("2026-01-05T12:00:00Z"),
    dueEndAt: overrides.dueEndAt ?? null,
    windowsFrom,
})

describe("başlangıç noktası", () => {
    it("üretimdeki lot > son rapor bitişi > plan; duraklatılmışta şimdi", () => {
        const now = at("2026-01-05T20:00:00Z")
        expect(forecastStartPoint(job, [lot({ status: "RUNNING", actualStartAt: at("2026-01-05T13:10:00Z") })], now)).toEqual({ startAt: at("2026-01-05T13:10:00Z"), includeSetup: false })
        const reported = [lot({ status: "COMPLETED", reported: true, actualEndAt: at("2026-01-05T13:00:00Z") })]
        expect(forecastStartPoint(job, reported, now).startAt).toEqual(at("2026-01-05T13:00:00Z"))
        expect(forecastStartPoint({ ...job, status: "PAUSED" }, reported, now).startAt).toEqual(now)
        expect(forecastStartPoint({ ...job, status: "RELEASED" }, [], now)).toEqual({ startAt: now, includeSetup: true })
    })
})

describe("forecastJob", () => {
    it("plana uygun: lot 1 plandaki kadar bastı", () => {
        const forecast = run({ lots: [lot({ status: "COMPLETED", reported: true, actualStartAt: job.productionStartAt, actualEndAt: at("2026-01-05T13:00:00Z"), actualShots: 1_125 }), lot({ status: "RUNNING", actualStartAt: at("2026-01-05T13:00:00Z") }), lot()] })
        expect(forecast).toMatchObject({ state: "ON_TRACK", reportedShots: 1_125, remainingShots: 1_875, delayMinutes: 0 })
        expect(forecast.progress).toBeCloseTo(0.375)
    })

    it("geride: lot 1 eksik bastı → tahmini bitiş kayar", () => {
        const forecast = run({
            now: at("2026-01-05T14:00:00Z"),
            lots: [lot({ status: "COMPLETED", reported: true, actualStartAt: job.productionStartAt, actualEndAt: at("2026-01-05T13:00:00Z"), actualShots: 600 }), lot({ status: "RUNNING", actualStartAt: at("2026-01-05T13:00:00Z") }), lot()],
        })
        // Kalan 2.400 baskı × 24 sn = 16 sa, 13:00Z'den kesintisiz (3×8) → 06.01 05:00Z; plan 01:30Z → +210 dk
        expect(forecast.projectedEndAt).toEqual(at("2026-01-06T05:00:00Z"))
        expect(forecast).toMatchObject({ state: "BEHIND", delayMinutes: 210 })
        expect(isForecastAlert(forecast)).toBe(true)
    })

    it("başlamadı: planlı üretim başlangıcı geçti, iş sahaya verilmiş ama lot yok; termin riski", () => {
        const forecast = run({ job: { status: "RELEASED" }, now: at("2026-01-05T09:00:00Z"), dueEndAt: at("2026-01-06T02:00:00Z") })
        expect(forecast.state).toBe("NOT_STARTED")
        // Şimdi + 30 dk bağlama + 20 sa üretim → 06.01 05:30Z
        expect(forecast.projectedEndAt).toEqual(at("2026-01-06T05:30:00Z"))
        expect(forecast.dueRisk).toBe(true)
    })

    it("süresi geçti ve üretim bitti ayrımı; tamamlanan iş", () => {
        expect(run({ now: at("2026-01-06T03:00:00Z"), lots: [lot({ status: "RUNNING", actualStartAt: at("2026-01-05T05:30:00Z") })] }).state).toBe("OVERDUE")
        const produced = run({ now: at("2026-01-06T03:00:00Z"), lots: [lot({ status: "COMPLETED", reported: true, actualEndAt: at("2026-01-06T01:00:00Z"), actualShots: 3_000 })] })
        expect(produced).toMatchObject({ state: "PRODUCED", projectedEndAt: at("2026-01-06T01:00:00Z"), delayMinutes: 0 })
        expect(run({ job: { status: "COMPLETED" } })).toMatchObject({ state: "DONE", projectedEndAt: null })
    })

    it("takvimde yer yoksa hesaplanamaz (geride + termin riski)", () => {
        const forecast = forecastJob({ job, lots: [], now: at("2026-01-05T12:00:00Z"), dueEndAt: at("2026-01-10T00:00:00Z"), windowsFrom: () => [] })
        expect(forecast).toMatchObject({ projectedEndAt: null, delayMinutes: null, state: "BEHIND", dueRisk: true })
    })
})

describe("makine takvimi ve termin", () => {
    it("makinenin geçerli düzeni; düzen yoksa pencere yok; termin günü sonu", () => {
        const pattern = { id: "p", name: "3×8", isDefault: true, timezone: "Europe/Istanbul", shifts }
        const windows = machineWindowsFrom({
            machine: { id: "m1", areaId: "a1", shiftPatternId: null },
            areaShiftPatternIds: {},
            patterns: [pattern],
            exceptions: [],
            downtimes: [{ startAt: at("2026-01-05T06:00:00Z"), endAt: at("2026-01-05T07:00:00Z") }],
        })(at("2026-01-05T05:00:00Z"))
        expect(windows[0]).toMatchObject({ shiftCode: "A", startAt: at("2026-01-05T05:00:00Z"), endAt: at("2026-01-05T06:00:00Z") })
        expect(machineWindowsFrom({ machine: { id: "m1", areaId: "a1", shiftPatternId: null }, areaShiftPatternIds: {}, patterns: [], exceptions: [], downtimes: [] })(at("2026-01-05T05:00:00Z"))).toEqual([])
        expect(dueEndAtFor([null, "2026-01-09", "2026-01-07"])).toEqual(at("2026-01-07T21:00:00Z"))
        expect(dueEndAtFor([null])).toBeNull()
    })
})

describe("tahta ve uyarı taramasının ortak hesabı", () => {
    const machine = { id: "m1", areaId: "a1", shiftPatternId: "p1" }
    const pattern = { id: "p1", name: "3×8", isDefault: true, timezone: "Europe/Istanbul", shifts }
    const base = { ...job, id: "j1", machineId: "m1", lots: [lot({ status: "RUNNING", actualStartAt: at("2026-01-05T05:30:00Z") }), lot(), lot()], dueDates: [] }

    it("her iş kendi makinesinin takvimiyle; makinesi olmayan işin tahmini hesaplanamaz", () => {
        const forecasts = forecastJobsOnMachines({
            jobs: [base, { ...base, id: "j2", machineId: "yok" }],
            machines: [machine],
            areaShiftPatternIds: { a1: null },
            patterns: [pattern],
            exceptions: [],
            downtimes: [{ machineId: "baska", startAt: at("2026-01-05T06:00:00Z"), endAt: at("2026-01-06T06:00:00Z") }],
            now: at("2026-01-05T12:00:00Z"),
        })
        // Başka makinenin duruşu bu işi etkilemez: plandaki gibi bitiyor.
        expect(forecasts.get("j1")).toMatchObject({ state: "ON_TRACK", projectedEndAt: at("2026-01-06T01:30:00Z") })
        expect(forecasts.get("j2")).toMatchObject({ projectedEndAt: null, state: "BEHIND" })
        expect(remainingShotsByMold([{ id: "j1", moldId: "k1" }, { id: "j2", moldId: "k1" }, { id: "yok", moldId: "k2" }], forecasts)).toEqual(new Map([["k1", 6_000], ["k2", 0]]))
    })

    it("takvim aralığı pencereyi ve bugünü birlikte kapsar", () => {
        const now = at("2026-01-05T12:00:00Z")
        expect(forecastCalendarRange({ from: "2026-03-01", to: "2026-03-07", windowStart: at("2026-02-28T21:00:00Z"), windowEnd: at("2026-03-07T21:00:00Z"), now })).toEqual({
            exceptions: { from: "2025-12-05", to: "2026-04-23" },
            downtimes: { from: at("2025-12-05T12:00:00Z"), to: at("2026-04-23T21:00:00Z") },
        })
        expect(forecastCalendarRange({ from: "2025-11-01", to: "2025-11-07", windowStart: at("2025-10-31T21:00:00Z"), windowEnd: at("2025-11-07T21:00:00Z"), now }).exceptions).toEqual({ from: "2025-10-01", to: "2026-02-21" })
    })

    it("metin: durum · tahmini bitiş · termin riski (tarih metin olarak da gelebilir)", () => {
        expect(describeForecast({ state: "BEHIND", projectedEndAt: "2026-01-06T03:00:00.000Z", delayMinutes: 90, dueRisk: true })).toBe("Geride · tahmini bitiş 06.01 06:00 (+1 sa 30 dk) · termin riski")
        expect(describeForecast({ state: "PRODUCED", projectedEndAt: null, delayMinutes: 0, dueRisk: false })).toBe("Üretim bitti, kapatılmadı")
    })
})
