import { MAINTENANCE_LEVEL_LABELS } from "@core/helpers/production/moldMaintenance"
import { formatDateKey, formatDateKeyRange } from "@core/helpers/production/productionCalendar"
import { formatProductionDateTime } from "@core/helpers/production/productionTime"
import type { MoldStats, MoldStatsRow } from "@/features/production/stats/api/types"
import { versionLabel } from "@/features/production/stats/lib/moldStatsFormat"
import { writeHeaderRow } from "@/features/production/stats/lib/productHistoryWorkbook"
import { MOLD_STATUS_LABELS } from "@/features/production/shared/moldStatus"

export { downloadWorkbook } from "@/features/production/stats/lib/productHistoryWorkbook"

/**
 * Kalıp istatistikleri Excel'i. exceljs YALNIZ `await import()` ile yüklenir. Üç sayfa: kalıplar,
 * makine kartları (öneri dahil), renk ve hammadde. Çevrim sn (bir ondalık), oranlar yüzde.
 */

export const MOLD_STATS_COLUMNS = [
    { header: "Kalıp", width: 10 },
    { header: "Ad", width: 24 },
    { header: "Durum", width: 12 },
    { header: "Toplam baskı", width: 12 },
    { header: "Bakım", width: 18 },
    { header: "Son bakımdan beri", width: 12 },
    { header: "Bakım aralığı", width: 12 },
    { header: "Açık işlerin kalanı", width: 12 },
    { header: "Son bakım", width: 11 },
    { header: "Raporlu vardiya", width: 9 },
    { header: "Baskı", width: 11 },
    { header: "Sağlam", width: 11 },
    { header: "Fire", width: 9 },
    { header: "Fire %", width: 8 },
    { header: "Plan çevrim (sn)", width: 10 },
    { header: "Gerçek çevrim (sn)", width: 10 },
    { header: "Sapma %", width: 8 },
    { header: "Çevrim önerisi", width: 9 },
] as const

export const MOLD_MACHINE_COLUMNS = [
    { header: "Kalıp", width: 10 },
    { header: "Makine", width: 9 },
    { header: "Kart", width: 7 },
    { header: "Kart çevrimi (sn)", width: 10 },
    { header: "Plan çevrim (sn)", width: 10 },
    { header: "Gerçek çevrim (sn)", width: 10 },
    { header: "Raporlu vardiya", width: 9 },
    { header: "Baskı", width: 11 },
    { header: "Önerilen çevrim (sn)", width: 11 },
    { header: "Karşılaştırılan", width: 13 },
    { header: "Fark %", width: 8 },
] as const

export const MOLD_VERSION_COLUMNS = [
    { header: "Kalıp", width: 10 },
    { header: "Renk · hammadde", width: 26 },
    { header: "Raporlu vardiya", width: 9 },
    { header: "Baskı", width: 11 },
    { header: "Plan çevrim (sn)", width: 10 },
    { header: "Gerçek çevrim (sn)", width: 10 },
    { header: "Fire %", width: 8 },
] as const

type Cell = string | number | null

const round1 = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10)
const percent = (rate: number | null) => (rate === null ? null : Math.round(rate * 1000) / 10)
const scrapRate = (good: number, scrap: number) => (good + scrap > 0 ? scrap / (good + scrap) : null)

/** Kalıp satırı — sıra `MOLD_STATS_COLUMNS` ile aynı. */
export function moldStatsSheetRow(row: MoldStatsRow): Cell[] {
    return [
        row.code,
        row.name,
        MOLD_STATUS_LABELS[row.status],
        row.totalShots,
        MAINTENANCE_LEVEL_LABELS[row.maintenance.level],
        row.maintenance.shotsSinceMaintenance,
        row.maintenance.intervalShots,
        row.shotsAhead,
        row.lastMaintenanceAt ? formatDateKey(row.lastMaintenanceAt.slice(0, 10)) : null,
        row.reportedLotCount,
        row.shots,
        row.goodQuantity,
        row.scrapQuantity,
        percent(row.scrapRate),
        round1(row.plannedCycleSec),
        round1(row.actualCycleSec),
        percent(row.deviation),
        row.suggestionCount,
    ]
}

/** "kalip-istatistikleri-2026-07-01_2026-09-28.xlsx" */
export function moldStatsFileName(stats: Pick<MoldStats, "range">): string {
    return `kalip-istatistikleri-${stats.range.from}_${stats.range.to}.xlsx`
}

export async function buildMoldStatsWorkbook(stats: MoldStats, rows: MoldStatsRow[], filterText: string, exportedAt = new Date()) {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Ceyhunlar Plastik — Üretim Planlama"
    workbook.created = exportedAt

    const sheet = workbook.addWorksheet("Kalıplar", { views: [{ state: "frozen", xSplit: 1, ySplit: 5 }] })
    sheet.columns = MOLD_STATS_COLUMNS.map((column) => ({ width: column.width }))
    sheet.getCell(1, 1).value = "Kalıp istatistikleri"
    sheet.getCell(1, 1).font = { bold: true, size: 14 }
    sheet.getCell(2, 1).value = `Aralık: ${formatDateKeyRange(stats.range.from, stats.range.to)} · Süzgeç: ${filterText}`
    sheet.getCell(3, 1).value = `Oluşturma: ${formatProductionDateTime(exportedAt)} · Gerçek çevrim: pencerede başlayan raporlu vardiyalarda (süre − duruş) ÷ baskı. Sayaç ve bakım bugünkü değer.`
    sheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: "FF64748B" } }
    writeHeaderRow(sheet.getRow(5), MOLD_STATS_COLUMNS)
    rows.forEach((row, index) => {
        sheet.getRow(6 + index).values = moldStatsSheetRow(row)
    })
    if (rows.length > 0) {
        sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + rows.length, column: MOLD_STATS_COLUMNS.length } }
    }

    const machines = workbook.addWorksheet("Makine kartları", { views: [{ state: "frozen", ySplit: 1 }] })
    machines.columns = MOLD_MACHINE_COLUMNS.map((column) => ({ width: column.width }))
    writeHeaderRow(machines.getRow(1), MOLD_MACHINE_COLUMNS)
    let machineRow = 2
    for (const row of rows) {
        for (const machine of row.machines) {
            machines.getRow(machineRow).values = [
                row.code,
                machine.machineCode,
                machine.hasCard ? "var" : "yok",
                round1(machine.cardCycleSec),
                round1(machine.plannedCycleSec),
                round1(machine.actualCycleSec),
                machine.reportedLotCount,
                machine.shots,
                machine.suggestion ? machine.suggestion.cycleTimeSec : null,
                machine.suggestion ? (machine.suggestion.referenceSource === "card" ? "Kart" : "Plan") : null,
                machine.suggestion ? percent(machine.suggestion.deviation) : null,
            ]
            machineRow += 1
        }
    }

    const versions = workbook.addWorksheet("Renk ve hammadde", { views: [{ state: "frozen", ySplit: 1 }] })
    versions.columns = MOLD_VERSION_COLUMNS.map((column) => ({ width: column.width }))
    writeHeaderRow(versions.getRow(1), MOLD_VERSION_COLUMNS)
    let versionRow = 2
    for (const row of rows) {
        for (const version of row.versions) {
            versions.getRow(versionRow).values = [
                row.code,
                versionLabel(version),
                version.reportedLotCount,
                version.shots,
                round1(version.plannedCycleSec),
                round1(version.actualCycleSec),
                percent(scrapRate(version.goodQuantity, version.scrapQuantity)),
            ]
            versionRow += 1
        }
    }

    return { buffer: await workbook.xlsx.writeBuffer(), fileName: moldStatsFileName(stats) }
}
