/**
 * Makine duruşları — SAF modül: I/O yok, import yok (frontend `@core/…` ile okur).
 *
 * Duruş, makinenin kullanılamadığı bir ZAMAN ARALIĞIDIR (planlı bakım, arıza…);
 * planlama motoru bu aralıkları makinenin çalışma pencerelerinden düşer. Aralık
 * yarı açıktır: [başlangıç, bitiş) — 08:00–12:00 ile 12:00–16:00 çakışmaz. Aynı
 * makinede çakışan iki duruş veri girişi hatası sayılır ve reddedilir.
 */

export const MAX_DOWNTIME_DAYS = 180
/** Listede "yaklaşan duruş" sayılan pencere. */
export const UPCOMING_DOWNTIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export type DowntimeInterval = {
    startAt: Date | string
    endAt: Date | string
}

const toTime = (value: Date | string) => (typeof value === "string" ? new Date(value) : value).getTime()

export type MachineDowntimeIssueCode = "INVALID_START" | "INVALID_END" | "END_NOT_AFTER_START" | "TOO_LONG"

export type MachineDowntimeIssue = {
    code: MachineDowntimeIssueCode
    message: string
}

export function findMachineDowntimeIssues(interval: DowntimeInterval): MachineDowntimeIssue[] {
    const start = toTime(interval.startAt)
    const end = toTime(interval.endAt)

    if (Number.isNaN(start)) return [{ code: "INVALID_START", message: "Başlangıç zamanı geçersiz." }]
    if (Number.isNaN(end)) return [{ code: "INVALID_END", message: "Bitiş zamanı geçersiz." }]
    if (end <= start) return [{ code: "END_NOT_AFTER_START", message: "Bitiş, başlangıçtan sonra olmalı." }]
    if (end - start > MAX_DOWNTIME_DAYS * 24 * 60 * 60 * 1000) {
        return [{ code: "TOO_LONG", message: `Bir duruş en fazla ${MAX_DOWNTIME_DAYS} gün olabilir.` }]
    }
    return []
}

/** Yarı açık aralıklar: uç uca değen iki duruş çakışmaz. */
export function downtimesOverlap(a: DowntimeInterval, b: DowntimeInterval): boolean {
    return toTime(a.startAt) < toTime(b.endAt) && toTime(b.startAt) < toTime(a.endAt)
}

export function downtimeDurationMinutes(interval: DowntimeInterval): number {
    return Math.round((toTime(interval.endAt) - toTime(interval.startAt)) / 60_000)
}

export type DowntimeTimeStatus = "past" | "active" | "upcoming"

/** Duruşun şimdiye göre yeri: bitti / sürüyor / henüz başlamadı. */
export function downtimeTimeStatus(interval: DowntimeInterval, now: Date): DowntimeTimeStatus {
    const nowTime = now.getTime()
    if (toTime(interval.endAt) <= nowTime) return "past"
    if (toTime(interval.startAt) <= nowTime) return "active"
    return "upcoming"
}

export type MachineDowntimeState<T extends DowntimeInterval> =
    | { status: "active"; downtime: T }
    | { status: "upcoming"; downtime: T }

/**
 * Makinenin o anki duruş durumu: sürmekte olan duruş ya da pencere içindeki en yakın
 * duruş; ikisi de yoksa `null`. Liste satırındaki uyarı için.
 */
export function describeMachineDowntimeState<T extends DowntimeInterval>(
    downtimes: T[],
    now: Date,
    upcomingWindowMs: number = UPCOMING_DOWNTIME_WINDOW_MS,
): MachineDowntimeState<T> | null {
    const nowTime = now.getTime()
    const byStart = [...downtimes].sort((a, b) => toTime(a.startAt) - toTime(b.startAt))

    const active = byStart.find((downtime) => toTime(downtime.startAt) <= nowTime && nowTime < toTime(downtime.endAt))
    if (active) return { status: "active", downtime: active }

    const upcoming = byStart.find((downtime) => {
        const start = toTime(downtime.startAt)
        return start > nowTime && start - nowTime <= upcomingWindowMs
    })
    return upcoming ? { status: "upcoming", downtime: upcoming } : null
}
