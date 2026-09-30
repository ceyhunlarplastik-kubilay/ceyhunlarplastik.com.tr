import { describe, expect, it } from "vitest"

import {
    buildMachineStats,
    isUnreportedClosedLot,
    machineTimeBreakdown,
    oeeLevel,
    type MachineStatsLotInput,
    type MachineStatsMachineInput,
    type UnreportedLotCandidate,
} from "./machineStats"
import { findStatsRangeIssue, recentStatsRange } from "./productionStats"

const at = (iso: string) => new Date(iso)
const MON_SAT = [1, 2, 3, 4, 5, 6]
// Tek vardiya 08:00–16:00 (TR), Pzt–Cmt.
const pattern = {
    id: "p1", name: "1×8", isDefault: true, timezone: "Europe/Istanbul",
    shifts: [{ code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 }],
}
// Pzt 28.09 00:00 → Çar 30.09 00:00 (TR): iki iş günü.
const window = { start: at("2026-09-27T21:00:00Z"), end: at("2026-09-29T21:00:00Z") }
const machine = (id: string, override: Partial<MachineStatsMachineInput> = {}): MachineStatsMachineInput => ({
    id, areaId: "a1", shiftPatternId: null, code: id.toUpperCase(), name: `Makine ${id}`, areaCode: "P1", status: "ACTIVE", ...override,
})
const m1 = machine("m1")
const m2 = machine("m2")

const stop = (minutes: number, category: MachineStatsLotInput["stops"][number]["category"], code: string) => ({
    minutes, category, reasonId: `r-${code}`, reasonCode: code, reasonName: `Neden ${code}`,
})

const lot = (start: string, end: string, override: Partial<MachineStatsLotInput> = {}): MachineStatsLotInput => ({
    machineId: "m1", actualStartAt: at(start), actualEndAt: at(end), actualShots: 0, cycleTimeSec: 24, stops: [], goodQuantity: 0, scrapQuantity: 0, ...override,
})

const lots: MachineStatsLotInput[] = [
    // Pzt 12:00–16:00: 240 dk; 30 dk arıza + 20 dk planlı mola; 500 baskı × 24 sn = 200 dk ideal.
    lot("2026-09-28T09:00:00Z", "2026-09-28T13:00:00Z", {
        actualShots: 500, stops: [stop(30, "BREAKDOWN", "D01"), stop(20, "PLANNED", "D10")], goodQuantity: 950, scrapQuantity: 50,
    }),
    // Sal 08:00–16:00: 480 dk; 60 dk malzeme; 1.000 baskı × 24 sn = 400 dk ideal.
    lot("2026-09-29T05:00:00Z", "2026-09-29T13:00:00Z", {
        actualShots: 1_000, stops: [stop(60, "MATERIAL", "D05")], goodQuantity: 1_980, scrapQuantity: 20,
    }),
]

const unreported = (machineId: string, plannedStart: string, actualStart: string | null, completedAt: string | null): UnreportedLotCandidate => ({
    machineId,
    plannedStartAt: at(plannedStart),
    actualStartAt: actualStart ? at(actualStart) : null,
    jobCompletedAt: completedAt ? at(completedAt) : null,
})

const base = {
    window,
    machines: [m1, m2],
    areaShiftPatternIds: { a1: null },
    patterns: [pattern],
    // M-02'de salı makineye özel tatil.
    exceptions: [{ date: "2026-09-29", kind: "HOLIDAY" as const, areaId: null, machineId: "m2" }],
    downtimes: [
        // Pzt 10:00–12:00 planlı bakım (vardiya içinde 120 dk) + 20:00–22:00 arıza (vardiya dışı: sayılmaz).
        { machineId: "m1", startAt: at("2026-09-28T07:00:00Z"), endAt: at("2026-09-28T09:00:00Z"), kind: "PLANNED_MAINTENANCE" as const },
        { machineId: "m1", startAt: at("2026-09-28T17:00:00Z"), endAt: at("2026-09-28T19:00:00Z"), kind: "BREAKDOWN" as const },
    ],
    lots,
    unreportedLots: [
        // İş Sal 10:00Z'de tamamlandı: öncesine planlanan vardiya sayılır.
        unreported("m2", "2026-09-28T05:00:00Z", null, "2026-09-29T10:00:00Z"),
        // Başlamış ama raporsuz kapanmış (pencere gerçek başlangıca göre).
        unreported("m2", "2026-09-30T05:00:00Z", "2026-09-28T20:00:00Z", "2026-09-28T21:00:00Z"),
        // Erken biten işin tamamlanmadan sonraya planlanmış, hiç başlamamış vardiyası: sayılmaz.
        unreported("m2", "2026-09-29T05:00:00Z", null, "2026-09-28T12:00:00Z"),
        // Pencere dışı: sayılmaz.
        unreported("m2", "2026-09-30T05:00:00Z", null, null),
    ],
}

describe("zaman dağılımı", () => {
    it("vardiya süresi takvim istisnasıyla; makine duruşunun yalnız vardiya içi kısmı; düzeni yoksa 0", () => {
        const time = machineTimeBreakdown({ machine: m1, areaShiftPatternIds: { a1: null }, patterns: [pattern], exceptions: base.exceptions, downtimes: base.downtimes, lots, window })
        expect(time).toEqual({
            capacityMinutes: 960,
            productionMinutes: 720,
            overtimeMinutes: 0,
            runMinutes: 610,
            stopMinutes: { PLANNED: 20, BREAKDOWN: 30, MATERIAL: 60, QUALITY: 0, PERSONNEL: 0, OTHER: 0 },
            downtimeMinutes: { PLANNED_MAINTENANCE: 120, BREAKDOWN: 0, OTHER: 0 },
            idleMinutes: 120,
        })
        expect(machineTimeBreakdown({ machine: m2, areaShiftPatternIds: { a1: null }, patterns: [pattern], exceptions: base.exceptions, downtimes: [], lots: [], window }))
            .toMatchObject({ capacityMinutes: 480, idleMinutes: 480 })
        expect(machineTimeBreakdown({ machine: m1, areaShiftPatternIds: { a1: null }, patterns: [], exceptions: [], downtimes: [], lots: [], window }))
            .toMatchObject({ capacityMinutes: 0, idleMinutes: 0 })
    })

    it("pencereden önce başlayan vardiya kırpılır; vardiya dışı üretim ayrı; üretimle ve birbiriyle çakışan duruş bir kez", () => {
        const time = machineTimeBreakdown({
            machine: m1,
            areaShiftPatternIds: { a1: null },
            patterns: [pattern],
            exceptions: [],
            downtimes: [
                // Pzt 09:00–11:00 arıza: 09:00–10:00 üretimde (lot raporunda), 10:30–11:00 planlı bakımla çakışıyor.
                { startAt: at("2026-09-28T06:00:00Z"), endAt: at("2026-09-28T08:00:00Z"), kind: "BREAKDOWN" },
                { startAt: at("2026-09-28T07:30:00Z"), endAt: at("2026-09-28T08:30:00Z"), kind: "PLANNED_MAINTENANCE" },
            ],
            lots: [
                // Paz 22:00 → Pzt 10:00 (720 dk; 600'ü pencerede, 120'si vardiyada); 72 dk arıza.
                lot("2026-09-27T19:00:00Z", "2026-09-28T07:00:00Z", { stops: [stop(72, "BREAKDOWN", "D01")] }),
                // Sal 13:00–17:00: son saati vardiya dışı.
                lot("2026-09-29T10:00:00Z", "2026-09-29T14:00:00Z"),
            ],
            window,
        })
        expect(time).toMatchObject({
            capacityMinutes: 960,
            productionMinutes: 840,
            overtimeMinutes: 540,
            downtimeMinutes: { PLANNED_MAINTENANCE: 60, BREAKDOWN: 30, OTHER: 0 },
            idleMinutes: 570,
        })
        // Pencere içindeki 600 dk lotun kendi oranıyla: 72 × 5/6 duruş, 648 × 5/6 net.
        expect(time.stopMinutes.BREAKDOWN).toBeCloseTo(60)
        expect(time.runMinutes).toBeCloseTo(540 + 240)
        // Vardiya süresi = vardiya içi üretim + makine duruşu + boş.
        expect(time.productionMinutes - time.overtimeMinutes + 60 + 30 + time.idleMinutes).toBe(time.capacityMinutes)
    })
})

describe("raporsuz vardiya", () => {
    it("tamamlanmadan önce planlanan ya da başlamış vardiya sayılır; pencere gerçek başlangıca göre", () => {
        expect(base.unreportedLots.map((candidate) => isUnreportedClosedLot(candidate, window))).toEqual([true, true, false, false])
        // Tamamlanma anı bilinmiyorsa (eski kayıt) sayılır.
        expect(isUnreportedClosedLot(unreported("m2", "2026-09-28T05:00:00Z", null, null), window)).toBe(true)
    })
})

describe("buildMachineStats", () => {
    it("OEE bileşenleri yalnız raporlu vardiyalardan; kullanım vardiya içi üretimden", () => {
        const { rows } = buildMachineStats(base)
        const row = rows.find((entry) => entry.machineId === "m1")!
        expect(row.report).toEqual({
            reportedLotCount: 2,
            unreportedLotCount: 0,
            grossMinutes: 720,
            stopMinutes: { PLANNED: 20, BREAKDOWN: 30, MATERIAL: 60, QUALITY: 0, PERSONNEL: 0, OTHER: 0 },
            runMinutes: 610,
            shots: 1_500,
            idealMinutes: 600,
            goodQuantity: 2_930,
            scrapQuantity: 70,
        })
        expect(row.utilization).toBe(0.75)
        expect(row.availability).toBeCloseTo(610 / 700)
        expect(row.performance).toBeCloseTo(600 / 610)
        expect(row.quality).toBeCloseTo(2_930 / 3_000)
        expect(row.oee).toBeCloseTo((610 / 700) * (600 / 610) * (2_930 / 3_000))
    })

    it("raporu olmayan makinede OEE yok, raporsuz vardiya sayısı var; toplamlar sürelerden", () => {
        const { rows, totals } = buildMachineStats(base)
        const row = rows.find((entry) => entry.machineId === "m2")!
        expect(row).toMatchObject({ oee: null, availability: null, utilization: 0, time: { capacityMinutes: 480, idleMinutes: 480 }, report: { unreportedLotCount: 2 } })
        expect(totals.time).toMatchObject({ capacityMinutes: 1_440, productionMinutes: 720, idleMinutes: 600 })
        expect(totals.report).toMatchObject({ reportedLotCount: 2, unreportedLotCount: 2 })
        expect(totals.utilization).toBe(0.5)
        expect(totals.oee).toBeCloseTo(rows[0].oee as number)
    })

    it("pencereden önce başlayan vardiya OEE'ye girmez ama zamanı pencerede sayılır", () => {
        const early = lot("2026-09-27T19:00:00Z", "2026-09-28T07:00:00Z", { actualShots: 1_000, goodQuantity: 2_000 })
        const { rows } = buildMachineStats({ ...base, machines: [m1], downtimes: [], lots: [early] })
        expect(rows[0].report.reportedLotCount).toBe(0)
        expect(rows[0].time).toMatchObject({ productionMinutes: 600, overtimeMinutes: 480 })
        expect(rows[0].oee).toBeNull()
    })

    it("pasif makine yalnız pencerede üretimi ya da raporsuz vardiyası varsa listelenir", () => {
        const idle = machine("m3", { status: "INACTIVE" })
        const used = machine("m4", { status: "INACTIVE" })
        const { rows, totals } = buildMachineStats({
            ...base,
            machines: [m1, idle, used],
            unreportedLots: [unreported("m4", "2026-09-28T05:00:00Z", null, null)],
        })
        expect(rows.map((row) => row.machineId)).toEqual(["m1", "m4"])
        // Listelenmeyen makinenin vardiya süresi toplama girmez.
        expect(totals.time.capacityMinutes).toBe(1_920)
    })

    it("en çok süre kaybettiren nedenler; duruşlar lot süresini aşamaz", () => {
        const { stopReasons } = buildMachineStats(base)
        expect(stopReasons.map((reason) => [reason.code, reason.minutes, reason.category, reason.count])).toEqual([
            ["D05", 60, "MATERIAL", 1],
            ["D01", 30, "BREAKDOWN", 1],
            ["D10", 20, "PLANNED", 1],
        ])

        const overflow = buildMachineStats({
            ...base,
            lots: [{ ...lots[0], stops: [stop(200, "BREAKDOWN", "D01"), stop(100, "QUALITY", "D07"), stop(10, null, "D99")] }],
        })
        expect(overflow.rows[0].report).toMatchObject({ grossMinutes: 240, runMinutes: 0, stopMinutes: { BREAKDOWN: 200, QUALITY: 40, OTHER: 0 } })
        expect(overflow.rows[0].performance).toBeNull()
        expect(overflow.stopReasons.map((reason) => reason.code)).toEqual(["D01", "D07", "D99"])
    })

    it("OEE seviyesi ve pencere sınırı", () => {
        expect([oeeLevel(0.9), oeeLevel(0.85), oeeLevel(0.7), oeeLevel(0.4), oeeLevel(null)]).toEqual(["good", "good", "fair", "poor", null])
        expect(recentStatsRange(at("2026-09-28T09:00:00Z"), 30)).toEqual({ from: "2026-08-30", to: "2026-09-28" })
        expect(findStatsRangeIssue("2025-01-01", "2026-09-28", 366)).toMatch(/1 yıl/)
        expect(findStatsRangeIssue("2026-01-01", "2026-09-28", 366)).toBeNull()
    })
})
