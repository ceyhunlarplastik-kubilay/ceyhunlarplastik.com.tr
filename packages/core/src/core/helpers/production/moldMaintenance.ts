/**
 * Kalıp BAKIM durumu — TEK KAYNAK (kalıplar sayfası, planlama tahtası, uyarı şeridi). SAF modül,
 * import yok; frontend de okuyabilir.
 *
 * Sayaç vardiya raporuyla artar (4.2); bakım aralığı tanımlıysa son bakımdan bu yana baskı
 * aralığın %85'ine gelince "yaklaşıyor", dolunca "geldi". Planlanan (henüz basılmamış) baskılarla
 * öngörülen durum da hesaplanır: planlı işler aralığı aşacaksa önceden uyarılır.
 */

export type MaintenanceLevel = "NONE" | "OK" | "SOON" | "DUE"

/** Bakım aralığının bu oranı dolunca "yaklaşıyor" (sahada yaygın pratik: %85–90). */
export const MAINTENANCE_WARNING_RATIO = 0.85

export const MAINTENANCE_LEVEL_LABELS: Record<MaintenanceLevel, string> = {
    NONE: "Aralık tanımsız",
    OK: "Uygun",
    SOON: "Bakım yaklaşıyor",
    DUE: "Bakım zamanı geldi",
}

export type MoldMaintenanceStatus = {
    level: MaintenanceLevel
    /** Planlanan baskılar da basılınca ulaşılacak seviye. */
    projectedLevel: MaintenanceLevel
    shotsSinceMaintenance: number
    intervalShots: number | null
    /** Bakıma kalan baskı (aşıldıysa eksi); aralık yoksa `null`. */
    remainingShots: number | null
    /** Son bakımdan bu yana / aralık; aralık yoksa `null`. */
    ratio: number | null
}

function levelFor(ratio: number): MaintenanceLevel {
    if (ratio >= 1) return "DUE"
    if (ratio >= MAINTENANCE_WARNING_RATIO) return "SOON"
    return "OK"
}

export function moldMaintenanceStatus(
    mold: { totalShots: number; maintenanceIntervalShots: number | null; shotsAtLastMaintenance: number },
    plannedShotsAhead = 0,
): MoldMaintenanceStatus {
    const shotsSinceMaintenance = Math.max(0, mold.totalShots - mold.shotsAtLastMaintenance)
    const interval = mold.maintenanceIntervalShots
    if (!interval || interval <= 0) {
        return { level: "NONE", projectedLevel: "NONE", shotsSinceMaintenance, intervalShots: null, remainingShots: null, ratio: null }
    }
    const ratio = shotsSinceMaintenance / interval
    return {
        level: levelFor(ratio),
        projectedLevel: levelFor((shotsSinceMaintenance + Math.max(0, plannedShotsAhead)) / interval),
        shotsSinceMaintenance,
        intervalShots: interval,
        remainingShots: interval - shotsSinceMaintenance,
        ratio,
    }
}

/** "Bakım yaklaşıyor · 95.000 / 100.000 baskı · planlı işlerle aşılacak" — tahta, şerit, bildirim. */
export function describeMaintenance(status: MoldMaintenanceStatus): string {
    if (status.level === "NONE" || status.intervalShots === null) return MAINTENANCE_LEVEL_LABELS.NONE
    const parts = [
        MAINTENANCE_LEVEL_LABELS[status.level],
        `${status.shotsSinceMaintenance.toLocaleString("tr-TR")} / ${status.intervalShots.toLocaleString("tr-TR")} baskı`,
    ]
    if (status.projectedLevel === "DUE" && status.level !== "DUE") parts.push("planlı işlerle aşılacak")
    return parts.join(" · ")
}

/** Uyarı gösterilecek mi: şimdi ya da planlı işlerle yaklaşıyor / geldi. */
export function isMaintenanceAlert(status: Pick<MoldMaintenanceStatus, "level" | "projectedLevel">): boolean {
    return status.level === "SOON" || status.level === "DUE" || status.projectedLevel === "DUE"
}
