import { computeProductionMinutes } from "@core/helpers/production/jobScheduling"
import { productionDateKey } from "@core/helpers/production/productionTime"

/**
 * İşin iki ayrı süresi — karıştırılınca iş olduğundan kısa sürüyormuş gibi görünüyordu:
 *  - ÇALIŞMA süresi: makinenin fiilen çalıştığı süre, planlama motorunun formülüyle
 *    (bağlama + baskı × çevrim ÷ verim) → "34 sa 6 dk".
 *  - TAKVİM: işin kapladığı fabrika günleri (geceler, çalışılmayan saatler dahil) → "3 gün".
 * Eski "Toplam süre" bağlama başı → planlı bitiş aralığını 24 saatlik günlerle yazıyordu ("2 gün 10 sa").
 */
export function jobWorkMinutes(job: { setupMinutes: number; plannedShots: number; cycleTimeSec: number; efficiencyPercent: number }) {
    const productionMinutes = computeProductionMinutes({
        shots: job.plannedShots,
        cycleTimeSec: job.cycleTimeSec,
        efficiencyPercent: job.efficiencyPercent,
    })
    return { setupMinutes: job.setupMinutes, productionMinutes, totalMinutes: job.setupMinutes + productionMinutes }
}

/** İşin takvimde kapladığı fabrika günleri (ilk ve son gün dahil); tam gece yarısı biten iş o günü saymaz. */
export function jobCalendarDays(startAt: Date | string, endAt: Date | string): { from: string; to: string; days: number } {
    const from = productionDateKey(new Date(startAt))
    const to = productionDateKey(new Date(new Date(endAt).getTime() - 1))
    const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
    return { from, to: to < from ? from : to, days: Math.max(1, days) }
}
