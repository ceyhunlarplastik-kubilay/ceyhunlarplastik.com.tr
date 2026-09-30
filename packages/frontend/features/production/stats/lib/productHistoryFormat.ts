import { addDaysToDateKey } from "@core/helpers/production/productionCalendar"
import { formatProductionShortDateTime, formatWorkMinutes } from "@core/helpers/production/productionTime"
import type { ProductHistoryRow } from "@/features/production/stats/api/types"

/**
 * Ürün geçmişi (5.1) — SAF gösterim yardımcıları: tablo, özet, grafik ve Excel aynı metni kullanır.
 */

const NUMBER = new Intl.NumberFormat("tr-TR")
const ONE_DECIMAL = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatQuantity(value: number): string {
    return NUMBER.format(value)
}

/** "22,5 sn"; veri yoksa "—". */
export function formatCycle(seconds: number | null): string {
    return seconds === null ? "—" : `${ONE_DECIMAL.format(seconds)} sn`
}

/** 0,02 → "%2,0"; veri yoksa "—". */
export function formatRate(rate: number | null): string {
    return rate === null ? "—" : `%${ONE_DECIMAL.format(rate * 100)}`
}

/** Gerçek çevrimin plandan sapması: "+%12,5" (yavaş) / "−%3,0" (hızlı); veri yoksa `null`. */
export function cycleDeviation(actual: number | null, planned: number | null): { ratio: number; text: string } | null {
    if (actual === null || planned === null || planned <= 0) return null
    const ratio = actual / planned - 1
    const sign = ratio > 0.0005 ? "+" : ratio < -0.0005 ? "−" : "±"
    return { ratio, text: `${sign}%${ONE_DECIMAL.format(Math.abs(ratio) * 100)}` }
}

/** Çalışma süresi ("34 sa 6 dk") — günle yazılmaz, 12 saatlik günlerde işi kısa gösterirdi. */
export function formatMinutes(minutes: number): string {
    return minutes > 0 ? formatWorkMinutes(minutes) : "—"
}

/** "01.09 08:10 – 02.09 00:00", süren işte "01.09 08:10 – sürüyor", başlamamışsa planlı başlangıç. */
export function productionPeriodText(row: Pick<ProductHistoryRow, "startedAt" | "endedAt" | "plannedStartAt">): string {
    if (!row.startedAt) return `plan: ${formatProductionShortDateTime(row.plannedStartAt)}`
    return `${formatProductionShortDateTime(row.startedAt)} – ${row.endedAt ? formatProductionShortDateTime(row.endedAt) : "sürüyor"}`
}

/** "V1 · Siyah · PP" */
export function versionText(version: ProductHistoryRow["version"]): string {
    if (!version) return "—"
    return [version.code, version.colorName, version.materials.join("/")].filter(Boolean).join(" · ")
}

export type StatsQuickRange = { label: string; from: string; to: string }

/** Ürün geçmişinin hızlı pencereleri (son 12 ay varsayılan). */
export const PRODUCT_HISTORY_QUICK_RANGES = [
    { label: "Son 30 gün", days: 30 },
    { label: "Son 3 ay", days: 90 },
    { label: "Son 12 ay", days: 365 },
] as const

/** Makine istatistiğinin hızlı pencereleri (son 30 gün varsayılan). */
export const MACHINE_STATS_QUICK_RANGES = [
    { label: "Son 7 gün", days: 7 },
    { label: "Son 30 gün", days: 30 },
    { label: "Son 3 ay", days: 90 },
] as const

/** Hızlı pencere düğmeleri (bugün dahil). */
export function statsQuickRanges(
    today: string,
    ranges: ReadonlyArray<{ label: string; days: number }> = PRODUCT_HISTORY_QUICK_RANGES,
): StatsQuickRange[] {
    return ranges.map((range) => ({ label: range.label, from: addDaysToDateKey(today, -(range.days - 1)), to: today }))
}

/** Grafikte en çok bu kadar üretim (en yeniler, soldan sağa eskiden yeniye). */
export const CHART_ROW_LIMIT = 40

export type QuantityChartPoint = { key: string; label: string; good: number; scrap: number }
export type CycleChartPoint = { key: string; label: string; planned: number; actual: number }

/**
 * Grafik verisi: adet satır başına (aile kalıbında ölçü de etikete girer), çevrim İŞ başına
 * (gerçek çevrimi olanlar). Satırlar en yeni önce gelir; grafik eskiden yeniye çizilir.
 */
export function productHistoryChartData(rows: ProductHistoryRow[]): { quantities: QuantityChartPoint[]; cycles: CycleChartPoint[]; limited: boolean } {
    const multiSize = new Set(rows.map((row) => row.size.id)).size > 1
    const recent = rows.slice(0, CHART_ROW_LIMIT).reverse()
    const quantities = recent.map((row) => ({
        key: row.jobOutputId,
        label: multiSize ? `${row.lotBaseNumber} · ${row.size.sizeCode}` : String(row.lotBaseNumber),
        good: row.goodQuantity,
        scrap: row.scrapQuantity,
    }))

    const seen = new Set<string>()
    const cycles: CycleChartPoint[] = []
    for (const row of recent) {
        if (seen.has(row.jobId) || row.actualCycleSec === null) continue
        seen.add(row.jobId)
        cycles.push({ key: row.jobId, label: String(row.lotBaseNumber), planned: row.plannedCycleSec, actual: Math.round(row.actualCycleSec * 10) / 10 })
    }
    return { quantities, cycles, limited: rows.length > CHART_ROW_LIMIT }
}
