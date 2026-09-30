import { describe, expect, it } from "vitest"

import type { MachineStats, MachineStatsRow, MachineStatsTotals } from "@/features/production/stats/api/types"
import {
    downtimeMinutesTotal,
    formatHours,
    machineTimeChartData,
    oeeComponentsText,
    stopReasonChartData,
    unplannedStopMinutes,
} from "./machineStatsFormat"
import { buildMachineStatsWorkbook, MACHINE_STATS_COLUMNS, machineStatsFileName, machineStatsSheetRow } from "./machineStatsWorkbook"
import { MACHINE_STATS_QUICK_RANGES, statsQuickRanges } from "./productHistoryFormat"

const totals = (override: Partial<MachineStatsTotals> = {}): MachineStatsTotals => ({
    time: {
        capacityMinutes: 960,
        productionMinutes: 720,
        overtimeMinutes: 0,
        runMinutes: 610,
        stopMinutes: { PLANNED: 20, BREAKDOWN: 30, MATERIAL: 60, QUALITY: 0, PERSONNEL: 0, OTHER: 0 },
        downtimeMinutes: { PLANNED_MAINTENANCE: 120, BREAKDOWN: 0, OTHER: 0 },
        idleMinutes: 120,
    },
    report: {
        reportedLotCount: 2,
        unreportedLotCount: 1,
        grossMinutes: 720,
        stopMinutes: { PLANNED: 20, BREAKDOWN: 30, MATERIAL: 60, QUALITY: 0, PERSONNEL: 0, OTHER: 0 },
        runMinutes: 610,
        shots: 1_500,
        idealMinutes: 600,
        goodQuantity: 2_930,
        scrapQuantity: 70,
    },
    utilization: 0.75,
    availability: 610 / 700,
    performance: 600 / 610,
    quality: 2_930 / 3_000,
    oee: (610 / 700) * (600 / 610) * (2_930 / 3_000),
    ...override,
})

const row = (override: Partial<MachineStatsRow> = {}): MachineStatsRow => ({
    machineId: "m-1",
    code: "M-01",
    name: "Arburg 320",
    areaCode: "P1",
    ...totals(),
    ...override,
})

describe("gösterim", () => {
    it("saat, duruş toplamları, OEE bileşenleri ve hızlı aralıklar", () => {
        expect(formatHours(750)).toBe("12,5 sa")
        expect(formatHours(0)).toBe("—")
        expect(unplannedStopMinutes(totals().report.stopMinutes)).toBe(90)
        expect(downtimeMinutesTotal({ PLANNED_MAINTENANCE: 120, BREAKDOWN: 30, OTHER: 0 })).toBe(150)
        expect(oeeComponentsText(totals())).toBe("Kullanılabilirlik %87,1 · Performans %98,4 · Kalite %97,7")
        expect(statsQuickRanges("2026-09-28", MACHINE_STATS_QUICK_RANGES).map((range) => [range.label, range.from])).toEqual([
            ["Son 7 gün", "2026-09-22"],
            ["Son 30 gün", "2026-08-30"],
            ["Son 3 ay", "2026-07-01"],
        ])
    })

    it("zaman grafiği saat cinsinden; duruş nedenleri etiketli", () => {
        expect(machineTimeChartData([row()])).toEqual([
            { key: "m-1", label: "M-01", run: 10.2, plannedStop: 0.3, unplannedStop: 1.5, downtime: 2, idle: 2 },
        ])
        expect(stopReasonChartData([{ reasonId: "r-1", code: "D05", name: "Hammadde yok", category: "MATERIAL", minutes: 60, count: 2 }]))
            .toEqual([{ key: "r-1", label: "D05 · Hammadde yok", hours: 1, count: 2, category: "MATERIAL" }])
    })
})

describe("Excel", () => {
    const stats: MachineStats = {
        range: { from: "2026-08-30", to: "2026-09-28", startAt: "2026-08-29T21:00:00.000Z", endAt: "2026-09-28T09:00:00.000Z" },
        generatedAt: "2026-09-28T09:00:00.000Z",
        areaId: "a-1",
        areas: [{ id: "a-1", code: "P1", name: "Pres 1" }],
        rows: [row(), row({ machineId: "m-2", code: "M-02", name: "Engel", ...totals({ oee: null, availability: null, performance: null, quality: null }) })],
        totals: totals(),
        stopReasons: [{ reasonId: "r-1", code: "D05", name: "Hammadde yok", category: "MATERIAL", minutes: 60, count: 1 }],
    }

    it("satır hücreleri kolon sırasıyla: saat, yüzde, seviye; dosya adında alan kodu", () => {
        const cells = machineStatsSheetRow(row(), row())
        expect(cells).toHaveLength(MACHINE_STATS_COLUMNS.length)
        expect(cells.slice(0, 5)).toEqual(["M-01", "Arburg 320", "P1", 16, 12])
        expect(cells.slice(10, 13)).toEqual([75, 2, 1])
        expect(cells.slice(-5)).toEqual([87.1, 98.4, 97.7, 83.7, "Orta"])
        expect(machineStatsSheetRow(stats.rows[1], stats.rows[1]).slice(-2)).toEqual([null, null])
        expect(machineStatsFileName(stats, "P1")).toBe("makine-kullanimi-P1-2026-08-30_2026-09-28.xlsx")
        expect(machineStatsFileName(stats, null)).toBe("makine-kullanimi-2026-08-30_2026-09-28.xlsx")
    })

    it("çalışma kitabı üretilir ve geri okunur: makineler + toplam, duruş nedenleri sayfası", async () => {
        const { buffer, fileName } = await buildMachineStatsWorkbook(stats, "P1 · Pres 1", new Date("2026-09-28T09:00:00Z"))
        expect(fileName).toBe("makine-kullanimi-P1-2026-08-30_2026-09-28.xlsx")
        const ExcelJS = (await import("exceljs")).default
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as ArrayBuffer)
        const sheet = workbook.getWorksheet("Makineler")
        expect(sheet?.getCell(5, 1).value).toBe("Makine")
        expect(sheet?.getCell(6, 1).value).toBe("M-01")
        expect(sheet?.getCell(8, 1).value).toBe("Toplam")
        expect(sheet?.getCell(8, 24).value).toBe(83.7)
        const reasons = workbook.getWorksheet("Duruş nedenleri")
        expect(reasons?.getRow(3).values).toEqual([undefined, "D05", "Hammadde yok", "Malzeme", 1, 1])
    })
})
