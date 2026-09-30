import { describe, expect, it } from "vitest"

import {
    buildProductHistory,
    defaultStatsRange,
    findStatsRangeIssue,
    jobProductionPeriod,
    jobRunStats,
    type StatsJobInput,
    type StatsLotInput,
} from "./productionStats"

const at = (iso: string) => new Date(iso)

const lot = (override: Partial<StatsLotInput> = {}): StatsLotInput => ({
    status: "COMPLETED",
    actualStartAt: at("2026-09-01T05:00:00Z"),
    actualEndAt: at("2026-09-01T13:00:00Z"),
    actualShots: 1_200,
    reported: true,
    stopMinutes: 60,
    outputs: [],
    ...override,
})

describe("pencere", () => {
    it("varsayılan son 12 ay (fabrika günü); biçim, sıra ve 3 yıl sınırı", () => {
        expect(defaultStatsRange(at("2026-09-28T22:30:00Z"))).toEqual({ from: "2025-09-30", to: "2026-09-29" })
        expect(findStatsRangeIssue("2026-01-01", "2026-12-31")).toBeNull()
        expect(findStatsRangeIssue("2026-13-01", "2026-12-31")).toMatch(/biçiminde/)
        expect(findStatsRangeIssue("2026-12-31", "2026-01-01")).toMatch(/sonra olamaz/)
        expect(findStatsRangeIssue("2020-01-01", "2026-01-01")).toMatch(/3 yıl/)
    })
})

describe("jobRunStats", () => {
    it("yalnız raporlu lotlar: brüt − duruş = net; gerçek çevrim = net ÷ baskı; üretimdeki lot başlangıca sayılır", () => {
        const stats = jobRunStats([
            lot(),
            lot({ actualStartAt: at("2026-09-01T13:00:00Z"), actualEndAt: at("2026-09-01T21:00:00Z"), actualShots: 1_320, stopMinutes: 0 }),
            lot({ status: "RUNNING", actualStartAt: at("2026-08-31T21:00:00Z"), actualEndAt: null, actualShots: null, reported: false }),
            lot({ status: "PLANNED", actualStartAt: null, actualEndAt: null, actualShots: null, reported: false }),
        ])
        expect(stats).toMatchObject({ reportedLotCount: 2, grossMinutes: 960, stopMinutes: 60, runMinutes: 900, shots: 2_520 })
        expect(stats.actualCycleSec).toBeCloseTo((900 * 60) / 2_520)
        expect(stats.firstStartAt).toEqual(at("2026-08-31T21:00:00Z"))
        expect(stats.lastEndAt).toEqual(at("2026-09-01T21:00:00Z"))
    })

    it("duruş lot süresini aşamaz; baskı yoksa çevrim yok", () => {
        const stats = jobRunStats([lot({ stopMinutes: 999, actualShots: 0 })])
        expect(stats).toMatchObject({ stopMinutes: 480, runMinutes: 0, actualCycleSec: null })
        expect(jobRunStats([])).toMatchObject({ reportedLotCount: 0, actualCycleSec: null, firstStartAt: null })
    })
})

describe("üretim dönemi", () => {
    const planned = { status: "RUNNING" as const, productionStartAt: at("2026-09-10T05:00:00Z"), plannedEndAt: at("2026-09-11T05:00:00Z") }
    const now = at("2026-09-12T12:00:00Z")

    it("gerçekleşen varsa o (tamamlandıysa son rapor, sürüyorsa şimdi); yoksa plan", () => {
        expect(jobProductionPeriod(planned, { firstStartAt: null, lastEndAt: null }, now)).toEqual({ start: planned.productionStartAt, end: planned.plannedEndAt })
        expect(jobProductionPeriod(planned, { firstStartAt: at("2026-09-01T05:00:00Z"), lastEndAt: at("2026-09-01T13:00:00Z") }, now)).toEqual({ start: at("2026-09-01T05:00:00Z"), end: now })
        expect(jobProductionPeriod({ ...planned, status: "COMPLETED" }, { firstStartAt: at("2026-09-01T05:00:00Z"), lastEndAt: at("2026-09-01T13:00:00Z") }, now))
            .toEqual({ start: at("2026-09-01T05:00:00Z"), end: at("2026-09-01T13:00:00Z") })
    })
})

describe("buildProductHistory", () => {
    const window = { start: at("2026-01-01T00:00:00Z"), end: at("2027-01-01T00:00:00Z") }
    const now = at("2026-09-28T12:00:00Z")
    const sizes = new Map([
        ["s-a", { id: "s-a", sizeCode: "10.1.1", label: "Çap: 10 mm" }],
        ["s-b", { id: "s-b", sizeCode: "10.1.2", label: "Çap: 12 mm" }],
    ])
    const versions = new Map([["color:k|materials:pp", { code: "V1", colorName: "Siyah", colorHex: "#111111", materials: ["PP"] }]])

    const job = (override: Partial<StatsJobInput> = {}): StatsJobInput => ({
        id: "j-1",
        lotBaseNumber: 1000,
        status: "COMPLETED",
        versionSignature: "color:k|materials:pp",
        machineCode: "M-01",
        moldCode: "K-1",
        productionStartAt: at("2026-09-01T05:00:00Z"),
        plannedEndAt: at("2026-09-01T21:00:00Z"),
        plannedShots: 2_400,
        cycleTimeSec: 20,
        efficiencyPercent: 100,
        outputs: [
            { id: "o-a", productSizeId: "s-a", cavities: 2, plannedQuantity: 4_800, goodQuantity: 4_900, scrapQuantity: 100, order: { orderNumber: "UE-1001", variantCode: "10.1.1.V1" } },
            // Aile kalıbında başka ürünün gözü: satır olmaz.
            { id: "o-x", productSizeId: "baska-urun", cavities: 2, plannedQuantity: 4_800, goodQuantity: 4_800, scrapQuantity: 0, order: null },
        ],
        lots: [
            lot({ outputs: [{ jobOutputId: "o-a", goodQuantity: 2_300, scrapQuantity: 100 }] }),
            lot({ actualStartAt: at("2026-09-01T13:00:00Z"), actualEndAt: at("2026-09-01T21:00:00Z"), actualShots: 1_200, stopMinutes: 0, outputs: [{ jobOutputId: "o-a", goodQuantity: 2_380, scrapQuantity: 20 }] }),
        ],
        ...override,
    })

    it("tamamlanan iş: kapanıştaki KESİN sayım; ölçü, versiyon, emir, süreler", () => {
        const { rows } = buildProductHistory({ jobs: [job()], sizes, versions, truncated: false, window, now })
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            lotBaseNumber: 1000,
            finalCount: true,
            size: { sizeCode: "10.1.1" },
            version: { code: "V1", colorName: "Siyah" },
            order: { orderNumber: "UE-1001" },
            goodQuantity: 4_900,
            scrapQuantity: 100,
            scrapRate: 0.02,
            lotCount: 2,
            reportedLotCount: 2,
            plannedMinutes: 800,
            grossMinutes: 960,
            runMinutes: 900,
            startedAt: at("2026-09-01T05:00:00Z"),
            endedAt: at("2026-09-01T21:00:00Z"),
        })
        expect(rows[0].actualCycleSec).toBeCloseTo(22.5)
    })

    it("süren iş: raporlu vardiyaların toplamı, bitiş yok; versiyonu eşleşmeyen iş versiyonsuz", () => {
        const { rows } = buildProductHistory({ jobs: [job({ status: "RUNNING", versionSignature: "baska" })], sizes, versions, truncated: false, window, now })
        expect(rows[0]).toMatchObject({ finalCount: false, goodQuantity: 4_680, scrapQuantity: 120, endedAt: null, version: null })
    })

    it("aile kalıbında iki ölçü iki satır; özet çevrimi iş başına bir kez sayar; en yeni önce", () => {
        const family = job({
            outputs: [
                { id: "o-a", productSizeId: "s-a", cavities: 2, plannedQuantity: 4_800, goodQuantity: 4_900, scrapQuantity: 100, order: null },
                { id: "o-b", productSizeId: "s-b", cavities: 2, plannedQuantity: 4_800, goodQuantity: 4_700, scrapQuantity: 300, order: null },
            ],
        })
        const older = job({
            id: "j-0",
            lotBaseNumber: 990,
            productionStartAt: at("2026-08-01T05:00:00Z"),
            outputs: [{ id: "o-c", productSizeId: "s-a", cavities: 2, plannedQuantity: 1_000, goodQuantity: 1_000, scrapQuantity: 0, order: null }],
            lots: [lot({ actualStartAt: at("2026-08-01T05:00:00Z"), actualEndAt: at("2026-08-01T13:00:00Z"), actualShots: 480, stopMinutes: 0 })],
        })
        const { rows, summary } = buildProductHistory({ jobs: [older, family], sizes, versions, truncated: true, window, now })
        expect(rows.map((row) => [row.lotBaseNumber, row.size.sizeCode])).toEqual([[1000, "10.1.1"], [1000, "10.1.2"], [990, "10.1.1"]])
        expect(summary).toMatchObject({
            jobCount: 2,
            rowCount: 3,
            plannedQuantity: 10_600,
            goodQuantity: 10_600,
            scrapQuantity: 400,
            reportedLotCount: 3,
            plannedCycleSec: 20,
            truncated: true,
        })
        // (900 + 480) dk net çalışma ÷ (2.400 + 480) baskı
        expect(summary.actualCycleSec).toBeCloseTo(((900 + 480) * 60) / 2_880)
        expect(summary.scrapRate).toBeCloseTo(400 / 11_000)
    })

    it("üretim dönemi pencereyle kesişmeyen iş elenir (planı pencerede olsa da gerçek üretimi eskiyse)", () => {
        const narrow = { start: at("2026-09-20T00:00:00Z"), end: at("2026-09-29T00:00:00Z") }
        // Planı pencerede ama 01.09'da üretilip kapanmış iş.
        const oldButReplanned = job({ productionStartAt: at("2026-09-25T05:00:00Z"), plannedEndAt: at("2026-09-25T21:00:00Z") })
        expect(buildProductHistory({ jobs: [oldButReplanned], sizes, versions, truncated: false, window: narrow, now }).rows).toEqual([])
        // Aynı iş sürüyorsa (şimdiye kadar) pencereye girer.
        expect(buildProductHistory({ jobs: [{ ...oldButReplanned, status: "RUNNING" }], sizes, versions, truncated: false, window: narrow, now }).rows).toHaveLength(1)
    })
})
