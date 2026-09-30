/**
 * Üretim uyarıları (4.5) — kalıcı bildirim (zil) kuralları. SAF modül (yalnız göreli import).
 *
 * Tarama (`functions/src/ProductionAlerts`) tahtadaki AYNI tahmin ve bakım hesabını kullanır
 * (`jobForecast.ts`, `moldMaintenance.ts`); burada yalnız "hangi durum bildirim olur, metni ne,
 * kime bir kez gider" kuralları var.
 *
 * Tekrar önleme: her uyarının bir ANAHTARI var; aynı anahtar aynı kullanıcıya bir kez gider.
 *  - Gecikme: iş + planlı bitiş — plan değişmedikçe (taşıma / kaydırma) bir kez.
 *  - Termin riski: iş + en yakın termin — termin değişirse yeniden.
 *  - Kalıp bakımı: kalıp + son bakım sayacı + seviye — her bakım döngüsünde "yaklaşıyor" ve
 *    "geldi" birer kez (bakım kaydedilince sayaç değişir, yeni döngü başlar).
 */
import { describeProjectedEnd, FORECAST_STATE_LABELS, isLateForecastState, type JobForecast } from "./jobForecast"
import { describeMaintenance, isMaintenanceAlert, type MoldMaintenanceStatus } from "./moldMaintenance"
import { formatDateKey } from "./productionCalendar"
import { productionDateKey } from "./productionTime"

export const PRODUCTION_ALERT_NOTIFICATION_TYPE = "PRODUCTION_ALERT"

/** Bildirimlerin alıcısı: yalnız Üretim Planlama rolü (kullanıcı kararı, 2026-09-28). */
export const PRODUCTION_ALERT_RECIPIENT_GROUPS = ["production_planner"]

/** Teslim edilmiş anahtarlar bu kadar gün geriye bakılarak okunur (anahtar planı / döngüyü taşır). */
export const PRODUCTION_ALERT_DEDUPE_LOOKBACK_DAYS = 60

export type ProductionAlertKind = "JOB_LATE" | "JOB_DUE_RISK" | "MOLD_MAINTENANCE_SOON" | "MOLD_MAINTENANCE_DUE"

export type ProductionAlert = {
    /** Tekrar önleme anahtarı. */
    key: string
    kind: ProductionAlertKind
    title: string
    message: string
    /** Bildirime tıklanınca gidilecek panel adresi. */
    href: string
}

export type AlertJobInput = {
    id: string
    lotBaseNumber: number
    machineCode: string
    setupStartAt: Date
    plannedEndAt: Date
    /** Bildirimde anılan emir: en yakın terminli (yoksa ilk) emir. */
    order: { orderNumber: string; variantCode: string; dueDate: string | null } | null
}

/** İş ayrıntısı tahtada açılır: pencere işin bağlama gününden başlar (`is` = iş kökü). */
export function jobAlertHref(job: Pick<AlertJobInput, "setupStartAt" | "lotBaseNumber">): string {
    return `/uretim/tahta?bas=${productionDateKey(job.setupStartAt)}&is=${job.lotBaseNumber}`
}

export function jobAlerts(job: AlertJobInput, forecast: JobForecast): ProductionAlert[] {
    const alerts: ProductionAlert[] = []
    const href = jobAlertHref(job)
    const subject = [job.machineCode, job.order?.orderNumber, job.order?.variantCode].filter(Boolean).join(" · ")

    if (isLateForecastState(forecast.state)) {
        alerts.push({
            key: `job:${job.id}:late:${job.plannedEndAt.toISOString()}`,
            kind: "JOB_LATE",
            title: `${FORECAST_STATE_LABELS[forecast.state]} · İş ${job.lotBaseNumber}`,
            message: `${subject} — ${describeProjectedEnd(forecast)}`,
            href,
        })
    }
    if (forecast.dueRisk && job.order?.dueDate) {
        alerts.push({
            key: `job:${job.id}:due:${job.order.dueDate}`,
            kind: "JOB_DUE_RISK",
            title: `Termin riski · İş ${job.lotBaseNumber}`,
            message: `${job.order.orderNumber} termini ${formatDateKey(job.order.dueDate)}; ${describeProjectedEnd(forecast)}`,
            href,
        })
    }
    return alerts
}

export type AlertMoldInput = { id: string; code: string; shotsAtLastMaintenance: number }

export function moldAlerts(mold: AlertMoldInput, status: MoldMaintenanceStatus): ProductionAlert[] {
    const href = `/uretim/kaliplar?q=${encodeURIComponent(mold.code)}`
    const cycle = `mold:${mold.id}:${mold.shotsAtLastMaintenance}`
    if (status.level === "DUE") {
        return [{ key: `${cycle}:due`, kind: "MOLD_MAINTENANCE_DUE", title: `Bakım zamanı geldi · Kalıp ${mold.code}`, message: describeMaintenance(status), href }]
    }
    if (isMaintenanceAlert(status)) {
        return [{ key: `${cycle}:soon`, kind: "MOLD_MAINTENANCE_SOON", title: `Bakım yaklaşıyor · Kalıp ${mold.code}`, message: describeMaintenance(status), href }]
    }
    return []
}

export function alertDeliveryKey(userId: string, alertKey: string): string {
    return `${userId}|${alertKey}`
}

/** Henüz gitmemiş (kullanıcı × uyarı) çiftleri; aynı taramada tekrarlanan anahtar bir kez sayılır. */
export function pendingAlertDeliveries(
    alerts: ProductionAlert[],
    recipientIds: string[],
    delivered: ReadonlySet<string>,
): Array<{ userId: string; alert: ProductionAlert }> {
    const unique = [...new Map(alerts.map((alert) => [alert.key, alert])).values()]
    return recipientIds.flatMap((userId) => unique
        .filter((alert) => !delivered.has(alertDeliveryKey(userId, alert.key)))
        .map((alert) => ({ userId, alert })))
}

/** Kullanıcı başına TEK canlı bildirim: bir uyarıysa kendisi, birden çoksa özet. */
export function realtimeAlertSummary(alerts: ProductionAlert[]): { title: string; message: string } {
    if (alerts.length === 1) return { title: alerts[0].title, message: alerts[0].message }
    const shown = alerts.slice(0, 3).map((alert) => alert.title).join(" · ")
    return {
        title: `${alerts.length} yeni üretim uyarısı`,
        message: alerts.length > 3 ? `${shown} · +${alerts.length - 3} uyarı daha` : shown,
    }
}
