import { describe, expect, it } from "vitest"

import {
    buildMoldStats,
    cycleSuggestion,
    roundCycleSec,
    type MoldStatsLotInput,
    type MoldStatsMoldInput,
} from "./moldStats"

const at = (iso: string) => new Date(iso)

const mold = (override: Partial<MoldStatsMoldInput> = {}): MoldStatsMoldInput => ({
    id: "k1",
    code: "K-1",
    name: "Tapa kalıbı",
    status: "ACTIVE",
    standardCycleTimeSec: 20,
    totalShots: 90_000,
    maintenanceIntervalShots: 100_000,
    shotsAtLastMaintenance: 0,
    lastMaintenanceAt: null,
    machineProfiles: [{ machineId: "m1", machineCode: "M-01", cycleTimeSec: 20 }],
    ...override,
})

// 8 saatlik vardiya, 60 dk duruş → 420 dk net; 1.050 baskı → 24 sn gerçek çevrim.
const lot = (override: Partial<MoldStatsLotInput> = {}): MoldStatsLotInput => ({
    moldId: "k1",
    machineId: "m1",
    machineCode: "M-01",
    versionSignature: "color:siyah|materials:pp",
    plannedCycleSec: 20,
    actualStartAt: at("2026-09-01T05:00:00Z"),
    actualEndAt: at("2026-09-01T13:00:00Z"),
    actualShots: 1_050,
    stopMinutes: 60,
    goodQuantity: 2_050,
    scrapQuantity: 50,
    ...override,
})

describe("cycleSuggestion", () => {
    it("en az 3 raporlu vardiya ve karttakinden en az %5 fark; değer 0,1 sn'ye yuvarlanır", () => {
        expect(cycleSuggestion({ actualCycleSec: 24.04, reportedLotCount: 3, cardCycleSec: 20, plannedCycleSec: 20 }))
            .toEqual({ cycleTimeSec: 24, referenceSec: 20, referenceSource: "card", deviation: expect.closeTo(0.202, 3) })
        expect(cycleSuggestion({ actualCycleSec: 24, reportedLotCount: 2, cardCycleSec: 20, plannedCycleSec: 20 })).toBeNull()
        expect(cycleSuggestion({ actualCycleSec: 20.9, reportedLotCount: 5, cardCycleSec: 20, plannedCycleSec: 20 })).toBeNull()
        // Hızlı çalışan kalıp da öneri üretir (kart düşürülür).
        expect(cycleSuggestion({ actualCycleSec: 17.66, reportedLotCount: 4, cardCycleSec: 20, plannedCycleSec: 20 })?.cycleTimeSec).toBe(17.7)
        expect(roundCycleSec(22.449)).toBe(22.4)
    })

    it("kart yoksa planların varsaydığıyla karşılaştırılır; baskı yoksa öneri yok", () => {
        expect(cycleSuggestion({ actualCycleSec: 26, reportedLotCount: 3, cardCycleSec: null, plannedCycleSec: 22 }))
            .toMatchObject({ cycleTimeSec: 26, referenceSec: 22, referenceSource: "plan" })
        expect(cycleSuggestion({ actualCycleSec: null, reportedLotCount: 9, cardCycleSec: 20, plannedCycleSec: 20 })).toBeNull()
        expect(cycleSuggestion({ actualCycleSec: 26, reportedLotCount: 3, cardCycleSec: null, plannedCycleSec: null })).toBeNull()
    })
})

describe("buildMoldStats", () => {
    const lots = [
        lot(),
        lot({ actualStartAt: at("2026-09-01T13:00:00Z"), actualEndAt: at("2026-09-01T21:00:00Z") }),
        lot({ actualStartAt: at("2026-09-02T05:00:00Z"), actualEndAt: at("2026-09-02T13:00:00Z"), versionSignature: "color:beyaz|materials:abs", actualShots: 840, plannedCycleSec: 22 }),
        // Başka makine, kartı yok, 2 vardiya: öneri eşiği tutmaz.
        lot({ machineId: "m2", machineCode: "M-02", stopMinutes: 0, actualShots: 1_200 }),
        lot({ machineId: "m2", machineCode: "M-02", stopMinutes: 0, actualShots: 1_200, actualStartAt: at("2026-09-02T13:00:00Z"), actualEndAt: at("2026-09-02T21:00:00Z") }),
    ]

    it("kalıp satırı: baskı ağırlıklı gerçek / plan çevrimi, fire oranı, bakım öngörüsü açık işlerin kalanıyla", () => {
        const { rows } = buildMoldStats({
            molds: [mold()],
            lots,
            // Kalan: 20.000 − 4.000 + (fazla raporlanmış iş: 0) → 90.000 + 16.000 aralığı aşar.
            openJobs: [{ moldId: "k1", plannedShots: 20_000, reportedShots: 4_000 }, { moldId: "k1", plannedShots: 500, reportedShots: 900 }],
        })
        const row = rows[0]
        expect(row).toMatchObject({ reportedLotCount: 5, shots: 5_340, goodQuantity: 10_250, scrapQuantity: 250, shotsAhead: 16_000, suggestionCount: 1 })
        // (3 × 420 + 2 × 480) dk ÷ 5.340 baskı
        expect(row.actualCycleSec).toBeCloseTo(((3 * 420 + 2 * 480) * 60) / 5_340)
        expect(row.plannedCycleSec).toBeCloseTo((20 * 4_500 + 22 * 840) / 5_340)
        expect(row.scrapRate).toBeCloseTo(250 / 10_500)
        expect(row.maintenance).toMatchObject({ level: "SOON", projectedLevel: "DUE", remainingShots: 10_000 })
    })

    it("makine kırılımı: kart çevrimi, öneri yalnız eşiği tutan makinede; versiyon kırılımı", () => {
        const { rows } = buildMoldStats({ molds: [mold()], lots, openJobs: [] })
        const [m1, m2] = rows[0].machines
        expect(m1).toMatchObject({ machineId: "m1", hasCard: true, cardCycleSec: 20, reportedLotCount: 3, shots: 2_940 })
        expect(m1.actualCycleSec).toBeCloseTo((3 * 420 * 60) / 2_940)
        expect(m1.suggestion).toMatchObject({ cycleTimeSec: 25.7, referenceSource: "card" })
        expect(m2).toMatchObject({ machineId: "m2", machineCode: "M-02", hasCard: false, cardCycleSec: null, reportedLotCount: 2, suggestion: null })
        expect(rows[0].versions.map((version) => [version.versionSignature, version.reportedLotCount])).toEqual([
            ["color:siyah|materials:pp", 4],
            ["color:beyaz|materials:abs", 1],
        ])
        expect(rows[0].versions[1].actualCycleSec).toBeCloseTo(30)
    })

    it("kartı olup üretimi olmayan makine de listelenir; kullanım dışı kalıp yalnız üretimi varsa; özet", () => {
        const retired = mold({ id: "k2", code: "K-2", status: "RETIRED", machineProfiles: [] })
        const idle = mold({ id: "k3", code: "K-3", totalShots: 10, machineProfiles: [{ machineId: "m9", machineCode: "M-09", cycleTimeSec: null }] })
        const { rows, summary } = buildMoldStats({ molds: [mold(), retired, idle], lots, openJobs: [] })
        expect(rows.map((row) => row.code)).toEqual(["K-1", "K-3"])
        expect(rows[1].machines).toEqual([expect.objectContaining({ machineId: "m9", hasCard: true, cardCycleSec: null, reportedLotCount: 0, actualCycleSec: null, suggestion: null })])
        expect(summary).toMatchObject({ moldCount: 2, usedMoldCount: 1, reportedLotCount: 5, shots: 5_340, maintenanceAlertCount: 1, suggestionCount: 1 })

        const withRetiredLot = buildMoldStats({ molds: [retired], lots: [lot({ moldId: "k2" })], openJobs: [] })
        expect(withRetiredLot.rows.map((row) => row.code)).toEqual(["K-2"])
        // Kullanım dışı kalıbın bakımı uyarı sayılmaz.
        expect(buildMoldStats({ molds: [mold({ status: "IN_MAINTENANCE" })], lots: [], openJobs: [] }).summary.maintenanceAlertCount).toBe(0)
    })
})
