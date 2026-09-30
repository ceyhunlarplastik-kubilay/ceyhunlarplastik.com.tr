import { isForecastAlert, isLateForecastState, isProducingForecastState } from "@core/helpers/production/jobForecast"
import { isMaintenanceAlert, type MoldMaintenanceStatus } from "@core/helpers/production/moldMaintenance"
import type { BoardJob } from "@/features/production/board/api/types"
import { toSpan, type TimeSpan } from "@/features/production/board/utils/boardGeometry"

/**
 * Tahtada planlanan ↔ gerçekleşen (4.3) — SAF yardımcılar. Tahmin sunucuda hesaplanır
 * (`core/helpers/production/jobForecast.ts`); burada yalnız çizim kurulur. Metinler (durum, tahmini
 * bitiş, bakım) bildirimlerle aynı olsun diye core'dan gelir.
 */
export { describeForecast } from "@core/helpers/production/jobForecast"
export { describeMaintenance } from "@core/helpers/production/moldMaintenance"

/** Gerçekleşen üretim aralıkları: raporlu lot başlangıç → bitiş, üretimdeki lot başlangıç → şimdi. */
export function actualLotSpans(job: BoardJob, now: Date): TimeSpan[] {
    const spans: TimeSpan[] = []
    for (const lot of job.lots) {
        if (!lot.actualStartAt) continue
        const end = lot.reported && lot.actualEndAt ? lot.actualEndAt : lot.status === "RUNNING" ? now : null
        if (!end) continue
        const span = toSpan(lot.actualStartAt, end)
        if (span.endMs > span.startMs) spans.push(span)
    }
    return spans
}

/**
 * Tahmini gecikme uzantısı: planlı bitişten tahmini bitişe — yalnız eşiği aşan gecikmede (plana uygun
 * sayılan birkaç dakikalık sapma çizilmez).
 */
export function projectedDelaySpan(job: BoardJob): TimeSpan | null {
    return isLateForecastState(job.forecast.state) ? overrunSpan(job) : null
}

function overrunSpan(job: BoardJob): TimeSpan | null {
    if (!job.forecast.projectedEndAt) return null
    const span = toSpan(job.plannedEndAt, job.forecast.projectedEndAt)
    return span.endMs > span.startMs ? span : null
}

/** Çubuk etiketindeki ilerleme ("%45"): rapor geldiyse ya da iş üretimdeyse. */
export function progressLabel(job: BoardJob): string | null {
    const started = job.forecast.reportedShots > 0 || job.status === "RUNNING" || job.status === "PAUSED"
    return started ? `%${Math.floor(job.forecast.progress * 100)}` : null
}

export type BoardMoldAlert = { mold: BoardJob["mold"]; status: MoldMaintenanceStatus }

export type BoardAlerts = {
    /** En çok geciken önce; tahmini hesaplanamayan en üstte. */
    lateJobs: BoardJob[]
    /** Kalıp başına bir kez; bakıma en yakın önce. */
    maintenanceMolds: BoardMoldAlert[]
}

/** Uyarı şeridi: penceredeki geciken / termin riskli işler ve bakımı gelen kalıplar. */
export function boardAlerts(jobs: BoardJob[]): BoardAlerts {
    const lateJobs = jobs
        .filter((job) => isForecastAlert(job.forecast))
        .sort((a, b) => (b.forecast.delayMinutes ?? Infinity) - (a.forecast.delayMinutes ?? Infinity) || a.lotBaseNumber - b.lotBaseNumber)

    const molds = new Map<string, BoardMoldAlert>()
    for (const job of jobs) {
        if (!molds.has(job.mold.id) && isMaintenanceAlert(job.moldMaintenance)) {
            molds.set(job.mold.id, { mold: job.mold, status: job.moldMaintenance })
        }
    }
    const maintenanceMolds = [...molds.values()].sort((a, b) => (b.status.ratio ?? 0) - (a.status.ratio ?? 0) || a.mold.code.localeCompare(b.mold.code, "tr"))

    return { lateJobs, maintenanceMolds }
}

/**
 * "Sonraki işleri kaydır" sunulur mu: sahaya verilmiş / üretimdeki iş plandan geç bitecekse — sunucu
 * ucuyla aynı koşul (eşik altı birkaç dakikalık gecikme de arkadaki işle çakışabilir).
 */
export function canPushFollowers(job: BoardJob): boolean {
    if (job.status === "PLANNED" || job.status === "COMPLETED" || job.status === "CANCELLED") return false
    return isProducingForecastState(job.forecast.state) && overrunSpan(job) !== null
}

/** Makinede bu işten sonra planlı işler (tahtada görünenler) — onay listesi için. */
export function plannedFollowersOnBoard(job: BoardJob, jobs: BoardJob[]): BoardJob[] {
    const from = new Date(job.setupStartAt).getTime()
    return jobs
        .filter((other) => other.id !== job.id && other.machineId === job.machineId && other.status === "PLANNED" && new Date(other.setupStartAt).getTime() >= from)
        .sort((a, b) => new Date(a.setupStartAt).getTime() - new Date(b.setupStartAt).getTime())
}
