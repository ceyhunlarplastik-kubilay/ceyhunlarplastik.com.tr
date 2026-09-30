import { oeeLevel, type OeeLevel } from "@core/helpers/production/machineStats"
import type { DowntimeKind, MachineStatsTotals, StopCategory, StopReasonTotal } from "@/features/production/stats/api/types"
import { formatRate } from "@/features/production/stats/lib/productHistoryFormat"

/**
 * Makine kullanımı ve OEE (5.2) — SAF gösterim yardımcıları: özet, grafik, tablo ve Excel aynı
 * metni kullanır. Hesap sunucuda (core `machineStats.ts`).
 */

const ONE_DECIMAL = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const OEE_LEVEL_LABELS: Record<OeeLevel, string> = { good: "İyi", fair: "Orta", poor: "Düşük" }

/** Rozet / hücre renkleri — ≥ %85 yeşil, %60–85 sarı, altı kırmızı. */
export const OEE_LEVEL_CLASS: Record<OeeLevel, string> = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    fair: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    poor: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
}

export { oeeLevel }

/** Dakika → "12,5 sa"; sıfırsa "—". */
export function formatHours(minutes: number): string {
    return minutes > 0.05 ? `${ONE_DECIMAL.format(minutes / 60)} sa` : "—"
}

/** Grafik / Excel için saat, bir ondalık. */
export function toHours(minutes: number): number {
    return Math.round((minutes / 60) * 10) / 10
}

export function sumValues(record: Record<string, number>): number {
    return Object.values(record).reduce((sum, value) => sum + value, 0)
}

/** Planlı olmayan tüm rapor duruşları (arıza, malzeme, kalite, personel, diğer). */
export function unplannedStopMinutes(stops: Record<StopCategory, number>): number {
    return sumValues(stops) - stops.PLANNED
}

export function downtimeMinutesTotal(downtimes: Record<DowntimeKind, number>): number {
    return sumValues(downtimes)
}

/** "Kullanılabilirlik %87,1 · Performans %98,4 · Kalite %97,7" */
export function oeeComponentsText(totals: Pick<MachineStatsTotals, "availability" | "performance" | "quality">): string {
    return `Kullanılabilirlik ${formatRate(totals.availability)} · Performans ${formatRate(totals.performance)} · Kalite ${formatRate(totals.quality)}`
}

export type TimeChartPoint = {
    key: string
    label: string
    run: number
    plannedStop: number
    unplannedStop: number
    downtime: number
    idle: number
}

/**
 * Zaman dağılımı grafiği (saat): üretim süresi raporun oranıyla net çalışma / planlı / plansız
 * duruşa bölünmüş hâliyle, makine duruşu ve boş. Vardiya dışı üretim varsa çubuk vardiya süresini aşar.
 */
export function machineTimeChartData(rows: Array<{ machineId: string; code: string } & Pick<MachineStatsTotals, "time">>): TimeChartPoint[] {
    return rows.map((row) => ({
        key: row.machineId,
        label: row.code,
        run: toHours(row.time.runMinutes),
        plannedStop: toHours(row.time.stopMinutes.PLANNED),
        unplannedStop: toHours(unplannedStopMinutes(row.time.stopMinutes)),
        downtime: toHours(downtimeMinutesTotal(row.time.downtimeMinutes)),
        idle: toHours(row.time.idleMinutes),
    }))
}

export type StopReasonChartPoint = { key: string; label: string; hours: number; count: number; category: StopCategory }

/** Duruş nedenleri grafiği — sunucu en çok süre kaybettirenden sıralı verir. */
export function stopReasonChartData(reasons: StopReasonTotal[]): StopReasonChartPoint[] {
    return reasons.map((reason) => ({
        key: reason.reasonId,
        label: `${reason.code} · ${reason.name}`,
        hours: toHours(reason.minutes),
        count: reason.count,
        category: reason.category,
    }))
}
