import { describe, expect, it } from "vitest"

import type { ProductHistory, ProductHistoryRow } from "@/features/production/stats/api/types"
import {
    cycleDeviation,
    formatCycle,
    formatRate,
    productHistoryChartData,
    productionPeriodText,
    statsQuickRanges,
    versionText,
} from "./productHistoryFormat"
import {
    buildProductHistoryWorkbook,
    PRODUCT_HISTORY_COLUMNS,
    productHistoryFileName,
    productHistorySheetRow,
} from "./productHistoryWorkbook"

const row = (override: Partial<ProductHistoryRow> = {}): ProductHistoryRow => ({
    jobId: "j-1",
    jobOutputId: "o-1",
    lotBaseNumber: 1000,
    jobStatus: "COMPLETED",
    finalCount: true,
    machineCode: "M-01",
    moldCode: "K-1",
    cavities: 2,
    size: { id: "s-a", sizeCode: "10.1.1", label: "Çap: 10 mm" },
    version: { code: "V1", colorName: "Siyah", colorHex: "#111111", materials: ["PP"] },
    order: { orderNumber: "UE-1001", variantCode: "10.1.1.V1" },
    plannedStartAt: "2026-09-01T05:00:00.000Z",
    plannedEndAt: "2026-09-01T21:00:00.000Z",
    startedAt: "2026-09-01T05:10:00.000Z",
    endedAt: "2026-09-01T21:00:00.000Z",
    lotCount: 2,
    reportedLotCount: 2,
    plannedQuantity: 4_800,
    goodQuantity: 4_750,
    scrapQuantity: 50,
    scrapRate: 50 / 4_800,
    plannedCycleSec: 20,
    actualCycleSec: 22.5,
    plannedMinutes: 941.18,
    grossMinutes: 950,
    runMinutes: 920,
    ...override,
})

describe("gösterim", () => {
    it("çevrim, oran, sapma, dönem ve versiyon metinleri", () => {
        expect(formatCycle(22.5)).toBe("22,5 sn")
        expect(formatCycle(null)).toBe("—")
        expect(formatRate(0.0104)).toBe("%1,0")
        expect(cycleDeviation(22.5, 20)).toEqual({ ratio: 0.125, text: "+%12,5" })
        expect(cycleDeviation(19.4, 20)?.text).toBe("−%3,0")
        expect(cycleDeviation(null, 20)).toBeNull()
        expect(productionPeriodText(row())).toBe("01.09 08:10 – 02.09 00:00")
        expect(productionPeriodText(row({ endedAt: null }))).toBe("01.09 08:10 – sürüyor")
        expect(productionPeriodText(row({ startedAt: null, endedAt: null }))).toBe("plan: 01.09 08:00")
        expect(versionText(row().version)).toBe("V1 · Siyah · PP")
        expect(versionText(null)).toBe("—")
        expect(statsQuickRanges("2026-09-28").map((range) => range.from)).toEqual(["2026-08-30", "2026-07-01", "2025-09-29"])
    })

    it("grafik: adet satır başına (çok ölçüde etikette ölçü), çevrim iş başına; eskiden yeniye", () => {
        const rows = [
            row({ jobId: "j-2", jobOutputId: "o-3", lotBaseNumber: 1001, size: { id: "s-b", sizeCode: "10.1.2", label: "" }, actualCycleSec: null }),
            row({ jobOutputId: "o-2", size: { id: "s-b", sizeCode: "10.1.2", label: "" } }),
            row(),
        ]
        const data = productHistoryChartData(rows)
        expect(data.quantities.map((point) => point.label)).toEqual(["1000 · 10.1.1", "1000 · 10.1.2", "1001 · 10.1.2"])
        expect(data.cycles).toEqual([{ key: "j-1", label: "1000", planned: 20, actual: 22.5 }])
        expect(data.limited).toBe(false)
    })
})

describe("Excel", () => {
    const history: ProductHistory = {
        product: { id: "p-1", code: "10.1", name: "Kare tapa" },
        range: { from: "2025-09-30", to: "2026-09-29" },
        sizes: [],
        versions: [],
        rows: [row(), row({ jobOutputId: "o-2", order: null, version: null, finalCount: false, jobStatus: "RUNNING", endedAt: null, scrapRate: null, actualCycleSec: null })],
        summary: { jobCount: 1, rowCount: 2, plannedQuantity: 9_600, goodQuantity: 9_500, scrapQuantity: 100, scrapRate: 100 / 9_600, reportedLotCount: 2, plannedCycleSec: 20, actualCycleSec: 22.5, truncated: false },
    }

    it("satır hücreleri kolon sırasıyla; sayılar sayı, yan ürün ve eksik veri okunur", () => {
        const cells = productHistorySheetRow(row())
        expect(cells).toHaveLength(PRODUCT_HISTORY_COLUMNS.length)
        expect(cells.slice(0, 4)).toEqual([1000, "UE-1001", "10.1.1.V1", "10.1.1"])
        expect(cells.slice(13, 19)).toEqual([4_800, 4_750, 50, 1, 20, 22.5])
        expect(productHistorySheetRow(history.rows[1]).slice(1, 3)).toEqual(["yan ürün", null])
        expect(productHistorySheetRow(history.rows[1]).slice(-2)).toEqual(["Üretimde", "Raporlu vardiyalar"])
        expect(productHistoryFileName(history)).toBe("uretim-gecmisi-10.1-2025-09-30_2026-09-29.xlsx")
    })

    it("çalışma kitabı üretilir ve geri okunur: başlık, veri ve toplam satırı", async () => {
        const { buffer, fileName } = await buildProductHistoryWorkbook(history, "Tüm ölçüler · Tüm versiyonlar", new Date("2026-09-28T09:00:00Z"))
        expect(fileName).toMatch(/\.xlsx$/)
        const ExcelJS = (await import("exceljs")).default
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as ArrayBuffer)
        const sheet = workbook.getWorksheet("Ürün geçmişi")
        expect(sheet?.getCell(5, 1).value).toBe("İş")
        expect(sheet?.getCell(6, 15).value).toBe(4_750)
        expect(sheet?.getCell(9, 1).value).toBe("Toplam")
        expect(sheet?.getCell(9, 15).value).toBe(9_500)
    })
})
