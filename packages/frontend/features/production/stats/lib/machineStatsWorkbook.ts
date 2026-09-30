import { formatDateKeyRange } from "@core/helpers/production/productionCalendar"
import { STOP_CATEGORY_LABELS } from "@core/helpers/production/productionReasons"
import { formatProductionDateTime } from "@core/helpers/production/productionTime"
import type { MachineStats, MachineStatsTotals } from "@/features/production/stats/api/types"
import { OEE_LEVEL_LABELS, oeeLevel, toHours, unplannedStopMinutes } from "@/features/production/stats/lib/machineStatsFormat"
import { writeHeaderRow } from "@/features/production/stats/lib/productHistoryWorkbook"

export { downloadWorkbook } from "@/features/production/stats/lib/productHistoryWorkbook"

/**
 * Makine kullanımı ve OEE Excel'i. exceljs YALNIZ `await import()` ile yüklenir. Süreler saat, oranlar
 * yüzde (bir ondalık) — sayı hücresi, Excel'de toplanabilir / süzülebilir.
 */

export const MACHINE_STATS_COLUMNS = [
    { header: "Makine", width: 9 },
    { header: "Ad", width: 18 },
    { header: "Alan", width: 7 },
    { header: "Vardiya süresi (sa)", width: 10 },
    { header: "Üretim (sa)", width: 9 },
    { header: "Vardiya dışı üretim (sa)", width: 10 },
    { header: "Planlı bakım (sa)", width: 9 },
    { header: "Arıza kaydı (sa)", width: 9 },
    { header: "Diğer makine duruşu (sa)", width: 10 },
    { header: "Boş (sa)", width: 9 },
    { header: "Kullanım %", width: 9 },
    { header: "Raporlu vardiya", width: 9 },
    { header: "Raporsuz vardiya", width: 9 },
    { header: "Rapor süresi (sa)", width: 9 },
    { header: "Planlı duruş (sa)", width: 9 },
    { header: "Plansız duruş (sa)", width: 9 },
    { header: "Net çalışma (sa)", width: 9 },
    { header: "Baskı", width: 10 },
    { header: "Sağlam", width: 11 },
    { header: "Fire", width: 9 },
    { header: "Kullanılabilirlik %", width: 11 },
    { header: "Performans %", width: 11 },
    { header: "Kalite %", width: 9 },
    { header: "OEE %", width: 8 },
    { header: "OEE seviyesi", width: 9 },
] as const

export const STOP_REASON_COLUMNS = [
    { header: "Kod", width: 9 },
    { header: "Neden", width: 30 },
    { header: "Kategori", width: 14 },
    { header: "Süre (sa)", width: 10 },
    { header: "Kayıt", width: 8 },
] as const

type Cell = string | number | null

const percent = (rate: number | null) => (rate === null ? null : Math.round(rate * 1000) / 10)

/** Makine (ya da toplam) satırının hücreleri — sıra `MACHINE_STATS_COLUMNS` ile aynı. */
export function machineStatsSheetRow(label: { code: string; name: string; areaCode: string }, totals: MachineStatsTotals): Cell[] {
    const level = oeeLevel(totals.oee)
    return [
        label.code,
        label.name,
        label.areaCode,
        toHours(totals.time.capacityMinutes),
        toHours(totals.time.productionMinutes),
        toHours(totals.time.overtimeMinutes),
        toHours(totals.time.downtimeMinutes.PLANNED_MAINTENANCE),
        toHours(totals.time.downtimeMinutes.BREAKDOWN),
        toHours(totals.time.downtimeMinutes.OTHER),
        toHours(totals.time.idleMinutes),
        percent(totals.utilization),
        totals.report.reportedLotCount,
        totals.report.unreportedLotCount,
        toHours(totals.report.grossMinutes),
        toHours(totals.report.stopMinutes.PLANNED),
        toHours(unplannedStopMinutes(totals.report.stopMinutes)),
        toHours(totals.report.runMinutes),
        totals.report.shots,
        totals.report.goodQuantity,
        totals.report.scrapQuantity,
        percent(totals.availability),
        percent(totals.performance),
        percent(totals.quality),
        percent(totals.oee),
        level ? OEE_LEVEL_LABELS[level] : null,
    ]
}

/** "makine-kullanimi-2026-08-30_2026-09-28.xlsx" (alan süzgecinde alan kodu eklenir). */
export function machineStatsFileName(stats: Pick<MachineStats, "range">, areaCode: string | null): string {
    const area = areaCode ? `-${areaCode.replace(/[^0-9A-Za-z.-]+/g, "-")}` : ""
    return `makine-kullanimi${area}-${stats.range.from}_${stats.range.to}.xlsx`
}

export async function buildMachineStatsWorkbook(stats: MachineStats, areaLabel: string | null, exportedAt = new Date()) {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Ceyhunlar Plastik — Üretim Planlama"
    workbook.created = exportedAt

    const sheet = workbook.addWorksheet("Makineler", { views: [{ state: "frozen", xSplit: 1, ySplit: 5 }] })
    sheet.columns = MACHINE_STATS_COLUMNS.map((column) => ({ width: column.width }))
    sheet.getCell(1, 1).value = "Makine kullanımı ve OEE"
    sheet.getCell(1, 1).font = { bold: true, size: 14 }
    sheet.getCell(2, 1).value = `Alan: ${areaLabel ?? "Tüm alanlar"} · Aralık: ${formatDateKeyRange(stats.range.from, stats.range.to)} (${formatProductionDateTime(stats.range.endAt)} itibarıyla)`
    sheet.getCell(3, 1).value = `Oluşturma: ${formatProductionDateTime(exportedAt)} · Zaman dağılımı vardiya süresinden; OEE yalnız pencerede başlayan raporlu vardiyalardan. Makine duruşu kayıtları OEE'ye girmez.`
    sheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: "FF64748B" } }
    writeHeaderRow(sheet.getRow(5), MACHINE_STATS_COLUMNS)

    stats.rows.forEach((row, index) => {
        sheet.getRow(6 + index).values = machineStatsSheetRow(row, row)
    })
    const totalRow = sheet.getRow(6 + stats.rows.length)
    totalRow.values = machineStatsSheetRow({ code: "Toplam", name: "", areaCode: "" }, stats.totals)
    totalRow.font = { bold: true }
    if (stats.rows.length > 0) {
        sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + stats.rows.length, column: MACHINE_STATS_COLUMNS.length } }
    }

    const reasons = workbook.addWorksheet("Duruş nedenleri", { views: [{ state: "frozen", ySplit: 2 }] })
    reasons.columns = STOP_REASON_COLUMNS.map((column) => ({ width: column.width }))
    reasons.getCell(1, 1).value = `En çok süre kaybettiren duruş nedenleri (en fazla ${stats.stopReasons.length || 10}) — raporlu vardiyalardan`
    reasons.getCell(1, 1).font = { bold: true }
    writeHeaderRow(reasons.getRow(2), STOP_REASON_COLUMNS)
    stats.stopReasons.forEach((reason, index) => {
        reasons.getRow(3 + index).values = [reason.code, reason.name, STOP_CATEGORY_LABELS[reason.category], toHours(reason.minutes), reason.count]
    })

    const areaCode = stats.areaId ? stats.areas.find((area) => area.id === stats.areaId)?.code ?? null : null
    return { buffer: await workbook.xlsx.writeBuffer(), fileName: machineStatsFileName(stats, areaCode) }
}
