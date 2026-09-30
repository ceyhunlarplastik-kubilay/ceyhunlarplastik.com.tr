import { describe, expect, it } from "vitest"

import type { MoldMachineCycleStats, MoldStats, MoldStatsRow } from "@/features/production/stats/api/types"
import { filterMoldStatsRows, hasMaintenanceAlert, suggestionReason, versionLabel } from "./moldStatsFormat"
import { buildMoldStatsWorkbook, MOLD_STATS_COLUMNS, moldStatsFileName, moldStatsSheetRow } from "./moldStatsWorkbook"

const totals = { reportedLotCount: 3, shots: 3_150, runMinutes: 1_260, goodQuantity: 6_150, scrapQuantity: 150, actualCycleSec: 24, plannedCycleSec: 20, deviation: 0.2 }

const machine = (override: Partial<MoldMachineCycleStats> = {}): MoldMachineCycleStats => ({
    machineId: "m-1",
    machineCode: "M-01",
    hasCard: true,
    cardCycleSec: 20,
    ...totals,
    suggestion: { cycleTimeSec: 24, referenceSec: 20, referenceSource: "card", deviation: 0.2 },
    ...override,
})

const row = (override: Partial<MoldStatsRow> = {}): MoldStatsRow => ({
    moldId: "k-1",
    code: "K-1045",
    name: "Tapa kalıbı",
    status: "ACTIVE",
    standardCycleTimeSec: 20,
    totalShots: 90_000,
    lastMaintenanceAt: "2026-01-10T00:00:00.000Z",
    maintenance: { level: "SOON", projectedLevel: "DUE", shotsSinceMaintenance: 90_000, intervalShots: 100_000, remainingShots: 10_000, ratio: 0.9 },
    shotsAhead: 21_800,
    ...totals,
    scrapRate: 150 / 6_300,
    machines: [machine(), machine({ machineId: "m-2", machineCode: "M-02", hasCard: false, cardCycleSec: null, suggestion: null })],
    versions: [{ versionSignature: "s-1", colorName: "Siyah", colorHex: "#111111", materials: ["PP"], ...totals }],
    suggestionCount: 1,
    ...override,
})

describe("süzgeç ve metinler", () => {
    const rows = [
        row(),
        row({ moldId: "k-2", code: "K-2000", name: "Kapak", suggestionCount: 0, maintenance: { ...row().maintenance, level: "OK", projectedLevel: "OK" }, machines: [] }),
        row({ moldId: "k-3", code: "K-3000", name: "Bakımdaki", status: "IN_MAINTENANCE", suggestionCount: 0 }),
    ]

    it("arama kod / ad / makine (Türkçe küçük harf); önerisi olanlar; bakım uyarısı yalnız kullanımdaki kalıpta", () => {
        const all = { search: "", onlySuggestions: false, onlyMaintenance: false }
        expect(filterMoldStatsRows(rows, { ...all, search: "KAPAK" }).map((entry) => entry.code)).toEqual(["K-2000"])
        expect(filterMoldStatsRows(rows, { ...all, search: "m-02" }).map((entry) => entry.code)).toEqual(["K-1045", "K-3000"])
        expect(filterMoldStatsRows(rows, { ...all, onlySuggestions: true }).map((entry) => entry.code)).toEqual(["K-1045"])
        expect(filterMoldStatsRows(rows, { ...all, onlyMaintenance: true }).map((entry) => entry.code)).toEqual(["K-1045"])
        expect(hasMaintenanceAlert(rows[2])).toBe(false)
    })

    it("renk · hammadde etiketi ve öneri gerekçesi", () => {
        expect(versionLabel({ colorName: "Siyah", materials: ["PP", "TALK"] })).toBe("Siyah · PP/TALK")
        expect(versionLabel({ colorName: null, materials: ["PP"] })).toBe("Renksiz · PP")
        expect(versionLabel({ colorName: null, materials: [] })).toBe("Tanımsız ayar")
        expect(suggestionReason(machine())).toBe("Gerçek 24,0 sn · kart 20,0 sn (+%20,0)")
        expect(suggestionReason(machine({ suggestion: { cycleTimeSec: 26, referenceSec: 22, referenceSource: "plan", deviation: 0.18 }, actualCycleSec: 26 })))
            .toBe("Gerçek 26,0 sn · plan 22,0 sn (+%18,2)")
        expect(suggestionReason(machine({ suggestion: null }))).toBeNull()
    })
})

describe("Excel", () => {
    const stats: MoldStats = {
        range: { from: "2026-07-01", to: "2026-09-28" },
        generatedAt: "2026-09-28T09:00:00.000Z",
        rows: [row()],
        summary: { moldCount: 1, usedMoldCount: 1, reportedLotCount: 3, shots: 3_150, goodQuantity: 6_150, scrapQuantity: 150, scrapRate: 150 / 6_300, maintenanceAlertCount: 1, suggestionCount: 1 },
    }

    it("kalıp satırı kolon sırasıyla; dosya adı", () => {
        const cells = moldStatsSheetRow(row())
        expect(cells).toHaveLength(MOLD_STATS_COLUMNS.length)
        expect(cells.slice(0, 5)).toEqual(["K-1045", "Tapa kalıbı", "Kullanımda", 90_000, "Bakım yaklaşıyor"])
        expect(cells.slice(-4)).toEqual([20, 24, 20, 1])
        expect(moldStatsFileName(stats)).toBe("kalip-istatistikleri-2026-07-01_2026-09-28.xlsx")
    })

    it("çalışma kitabı üretilir ve geri okunur: kalıplar, makine kartları (öneri dahil), renk ve hammadde", async () => {
        const { buffer } = await buildMoldStatsWorkbook(stats, stats.rows, "tüm kalıplar", new Date("2026-09-28T09:00:00Z"))
        const ExcelJS = (await import("exceljs")).default
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as ArrayBuffer)
        expect(workbook.getWorksheet("Kalıplar")?.getCell(6, 1).value).toBe("K-1045")
        expect(workbook.getWorksheet("Makine kartları")?.getRow(2).values).toEqual([undefined, "K-1045", "M-01", "var", 20, 20, 24, 3, 3_150, 24, "Kart", 20])
        // Kartı ve önerisi olmayan makine: boş hücreler.
        const noCard = workbook.getWorksheet("Makine kartları")?.getRow(3)
        expect([noCard?.getCell(2).value, noCard?.getCell(3).value, noCard?.getCell(4).value, noCard?.getCell(9).value]).toEqual(["M-02", "yok", null, null])
        expect(workbook.getWorksheet("Renk ve hammadde")?.getRow(2).values).toEqual([undefined, "K-1045", "Siyah · PP", 3, 3_150, 20, 24, 2.4])
    })
})
