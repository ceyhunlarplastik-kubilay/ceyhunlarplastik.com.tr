import type { Row } from "exceljs"

import { formatDateKeyRange } from "@core/helpers/production/productionCalendar"
import { formatProductionDateTime } from "@core/helpers/production/productionTime"
import { JOB_STATUS_LABELS } from "@core/helpers/production/jobStateMachine"
import type { ProductHistory, ProductHistoryRow } from "@/features/production/stats/api/types"

/**
 * Ürün geçmişi Excel'i. exceljs YALNIZ burada ve `await import()` ile yüklenir (~1MB; panel ilk
 * yükünde inmesin — `usageFunctionWorkbook.ts` deseni). Sayılar sayı hücresi (Excel'de toplanabilir),
 * tarihler fabrika saatiyle metin (tarayıcı saat dilimine bağlı kalmasın).
 */

export const PRODUCT_HISTORY_COLUMNS = [
    { header: "İş", width: 8 },
    { header: "Emir", width: 11 },
    { header: "Varyant", width: 14 },
    { header: "Ölçü", width: 10 },
    { header: "Ölçü açıklaması", width: 28 },
    { header: "Versiyon", width: 20 },
    { header: "Makine", width: 9 },
    { header: "Kalıp", width: 10 },
    { header: "Göz", width: 6 },
    { header: "Başlangıç", width: 17 },
    { header: "Bitiş", width: 17 },
    { header: "Raporlu vardiya", width: 10 },
    { header: "Vardiya", width: 9 },
    { header: "Planlanan", width: 11 },
    { header: "Sağlam", width: 11 },
    { header: "Fire", width: 9 },
    { header: "Fire %", width: 8 },
    { header: "Plan çevrim (sn)", width: 11 },
    { header: "Gerçek çevrim (sn)", width: 11 },
    { header: "Plan süre (dk)", width: 11 },
    { header: "Net çalışma (dk)", width: 11 },
    { header: "Durum", width: 14 },
    { header: "Adet kaynağı", width: 20 },
] as const

type Cell = string | number | null

const round1 = (value: number) => Math.round(value * 10) / 10

/** Bir satırın hücreleri — sıra `PRODUCT_HISTORY_COLUMNS` ile aynı. */
export function productHistorySheetRow(row: ProductHistoryRow): Cell[] {
    return [
        row.lotBaseNumber,
        row.order?.orderNumber ?? "yan ürün",
        row.order?.variantCode ?? null,
        row.size.sizeCode,
        row.size.label,
        row.version ? [row.version.code, row.version.colorName, row.version.materials.join("/")].filter(Boolean).join(" · ") : null,
        row.machineCode,
        row.moldCode,
        row.cavities,
        row.startedAt ? formatProductionDateTime(row.startedAt) : null,
        row.endedAt ? formatProductionDateTime(row.endedAt) : null,
        row.reportedLotCount,
        row.lotCount,
        row.plannedQuantity,
        row.goodQuantity,
        row.scrapQuantity,
        row.scrapRate === null ? null : round1(row.scrapRate * 100),
        round1(row.plannedCycleSec),
        row.actualCycleSec === null ? null : round1(row.actualCycleSec),
        Math.round(row.plannedMinutes),
        Math.round(row.runMinutes),
        JOB_STATUS_LABELS[row.jobStatus],
        row.finalCount ? "Kapanış sayımı" : "Raporlu vardiyalar",
    ]
}

/** "uretim-gecmisi-10.1-2025-09-30_2026-09-29.xlsx" */
export function productHistoryFileName(history: Pick<ProductHistory, "product" | "range">): string {
    const code = history.product.code.replace(/[^0-9A-Za-z.-]+/g, "-")
    return `uretim-gecmisi-${code}-${history.range.from}_${history.range.to}.xlsx`
}

export async function buildProductHistoryWorkbook(history: ProductHistory, filterText: string, exportedAt = new Date()) {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Ceyhunlar Plastik — Üretim Planlama"
    workbook.created = exportedAt

    const sheet = workbook.addWorksheet("Ürün geçmişi", { views: [{ state: "frozen", ySplit: 5 }] })
    sheet.columns = PRODUCT_HISTORY_COLUMNS.map((column) => ({ width: column.width }))

    sheet.getCell(1, 1).value = `Ürün geçmişi — ${history.product.code} · ${history.product.name}`
    sheet.getCell(1, 1).font = { bold: true, size: 14 }
    sheet.getCell(2, 1).value = `Süzgeç: ${filterText} · Aralık: ${formatDateKeyRange(history.range.from, history.range.to)}`
    sheet.getCell(3, 1).value = `Oluşturma: ${formatProductionDateTime(exportedAt)} · Tamamlanan işte adet kapanış sayımı, sürende raporlu vardiyaların toplamı.`
    sheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: "FF64748B" } }

    writeHeaderRow(sheet.getRow(5), PRODUCT_HISTORY_COLUMNS)

    history.rows.forEach((row, index) => {
        sheet.getRow(6 + index).values = productHistorySheetRow(row)
    })

    const summaryRow = sheet.getRow(6 + history.rows.length + 1)
    summaryRow.getCell(1).value = "Toplam"
    summaryRow.getCell(14).value = history.summary.plannedQuantity
    summaryRow.getCell(15).value = history.summary.goodQuantity
    summaryRow.getCell(16).value = history.summary.scrapQuantity
    summaryRow.getCell(17).value = history.summary.scrapRate === null ? null : round1(history.summary.scrapRate * 100)
    summaryRow.getCell(18).value = history.summary.plannedCycleSec === null ? null : round1(history.summary.plannedCycleSec)
    summaryRow.getCell(19).value = history.summary.actualCycleSec === null ? null : round1(history.summary.actualCycleSec)
    summaryRow.font = { bold: true }

    if (history.rows.length > 0) {
        sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + history.rows.length, column: PRODUCT_HISTORY_COLUMNS.length } }
    }

    return { buffer: await workbook.xlsx.writeBuffer(), fileName: productHistoryFileName(history) }
}

/** Koyu başlık satırı — istatistik Excel'lerinde ortak. */
export function writeHeaderRow(header: Row, columns: ReadonlyArray<{ header: string }>) {
    columns.forEach((column, index) => {
        const cell = header.getCell(index + 1)
        cell.value = column.header
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } }
        cell.alignment = { vertical: "middle", wrapText: true }
    })
    header.height = 30
}

/** Tarayıcıda dosyayı indirir. */
export function downloadWorkbook(buffer: ArrayBuffer, fileName: string) {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
}
