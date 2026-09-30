import { downtimeTimeStatus, type DowntimeInterval } from "@core/helpers/production/machineDowntimes"
import { productionDateKey, wallTimeToUtc } from "@core/helpers/production/productionTime"

export const RECENT_DOWNTIME_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Listelenen pencerenin başı: fabrika takviminde 30 gün önceki günün 00:00'ı (UTC ISO).
 * Güne yuvarlanır ki aynı gün içinde sorgu anahtarı değişmesin.
 */
export function recentDowntimesWindow(now: Date): { from: string } {
    const dayKey = productionDateKey(new Date(now.getTime() - RECENT_DOWNTIME_DAYS * DAY_MS))
    return { from: (wallTimeToUtc(`${dayKey}T00:00`) ?? now).toISOString() }
}

/**
 * Liste sırası: önce sürenler ve yaklaşanlar (en yakın başlangıç üstte), sonra
 * geçmişler (en yeni üstte) — planlayıcının bakacağı kayıt başta olsun.
 */
export function sortDowntimesForList<T extends DowntimeInterval>(downtimes: T[], now: Date): T[] {
    const startTime = (downtime: T) => new Date(downtime.startAt).getTime()
    const open = downtimes.filter((downtime) => downtimeTimeStatus(downtime, now) !== "past")
    const past = downtimes.filter((downtime) => downtimeTimeStatus(downtime, now) === "past")

    return [
        ...open.sort((a, b) => startTime(a) - startTime(b)),
        ...past.sort((a, b) => startTime(b) - startTime(a)),
    ]
}

/** Kaydı gireni kısa yazar; kullanıcı silinmişse ya da adı yoksa `null`. */
export function describeDowntimeAuthor(user: { firstName: string | null; lastName: string | null } | null): string | null {
    if (!user) return null
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    return name || null
}
