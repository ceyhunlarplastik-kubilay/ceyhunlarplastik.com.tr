/**
 * Üretim takvimi istisnaları — SAF modül: I/O yok, import yok (frontend `@core/…` ile
 * okur). Backend doğrulaması ile form AYNI fonksiyonlardan geçer.
 *
 * Kavramlar
 *  - Kayıt GÜN başınadır (`ProductionCalendarException.date`, `@db.Date`): planlama
 *    motoru "bu makine bu vardiya gününde çalışıyor mu?" sorusunu tek gün üzerinden
 *    sorar. Kullanıcı ise bayramı ARALIK olarak girer ve listede tek satır görmek ister:
 *    aralık yazılırken günlere açılır (`enumerateDateKeys`), listede ardışık günler
 *    yeniden birleştirilir (`groupCalendarExceptionDays`).
 *  - Gün, fabrika takvimindeki gündür ve "YYYY-MM-DD" anahtarıyla taşınır; veritabanına
 *    UTC gece yarısı olarak yazılır (`dateKeyToUtcDate`) — saat dilimi kaymasına kapalı.
 *  - Kapsam: alan ve makine boşsa tüm fabrika; ikisinden yalnız biri dolu olabilir.
 *    Aynı gün + aynı kapsamda en fazla bir istisna olur (uygulama katmanında; NULL'lı
 *    unique index Postgres'te bu çakışmayı yakalamaz). Farklı kapsamlar bir arada
 *    olabilir — fabrika tatilken bir alan ek mesai yapabilir; en dar kapsam geçerlidir
 *    (makine > alan > fabrika).
 */

export const MAX_CALENDAR_EXCEPTION_DAYS = 62

export type CalendarExceptionKind = "HOLIDAY" | "SHUTDOWN" | "EXTRA_WORKDAY"

export type CalendarExceptionScope = {
    areaId: string | null
    machineId: string | null
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 24 * 60 * 60 * 1000

// ---- Gün anahtarları ----

export function isValidDateKey(value: string): boolean {
    const match = DATE_KEY_PATTERN.exec(value)
    if (!match) return false
    const [year, month, day] = match.slice(1).map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** "2026-05-26" → 2026-05-26T00:00:00.000Z (`@db.Date` sütununa yazılan değer). */
export function dateKeyToUtcDate(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day))
}

/** `@db.Date` sütunundan okunan UTC gece yarısı → "2026-05-26". */
export function utcDateToDateKey(date: Date): string {
    return date.toISOString().slice(0, 10)
}

export function addDaysToDateKey(dateKey: string, days: number): string {
    return utcDateToDateKey(new Date(dateKeyToUtcDate(dateKey).getTime() + days * DAY_MS))
}

/** `end - start` gün cinsinden (aynı gün → 0). */
export function daysBetweenDateKeys(start: string, end: string): number {
    return Math.round((dateKeyToUtcDate(end).getTime() - dateKeyToUtcDate(start).getTime()) / DAY_MS)
}

/** Başlangıç ve bitiş DAHİL günler; bitiş başlangıçtan önceyse boş. */
export function enumerateDateKeys(start: string, end: string): string[] {
    const count = daysBetweenDateKeys(start, end) + 1
    return Array.from({ length: Math.max(0, count) }, (_, index) => addDaysToDateKey(start, index))
}

/** 1 = Pazartesi … 7 = Pazar (vardiya düzeninin `daysOfWeek`'iyle aynı). */
export function weekdayOfDateKey(dateKey: string): number {
    const weekday = dateKeyToUtcDate(dateKey).getUTCDay()
    return weekday === 0 ? 7 : weekday
}

/** "2026-05-26" → "26.05.2026". */
export function formatDateKey(dateKey: string): string {
    const match = DATE_KEY_PATTERN.exec(dateKey)
    return match ? `${match[3]}.${match[2]}.${match[1]}` : dateKey
}

/** "26.05.2026" ya da "26.05.2026 – 30.05.2026". */
export function formatDateKeyRange(start: string, end: string): string {
    return start === end ? formatDateKey(start) : `${formatDateKey(start)} – ${formatDateKey(end)}`
}

/** Hata mesajı için kısa liste: "26.05.2026, 27.05.2026 ve 3 gün daha". */
export function formatDateKeyList(dateKeys: string[], maxShown = 5): string {
    const sorted = [...dateKeys].sort()
    const shown = sorted.slice(0, maxShown).map(formatDateKey).join(", ")
    const hidden = sorted.length - maxShown
    return hidden > 0 ? `${shown} ve ${hidden} gün daha` : shown
}

// ---- Kapsam ----

/** "factory" · "area:<id>" · "machine:<id>" — gruplama ve çakışma anahtarı. */
export function calendarExceptionScopeKey(scope: CalendarExceptionScope): string {
    if (scope.machineId) return `machine:${scope.machineId}`
    if (scope.areaId) return `area:${scope.areaId}`
    return "factory"
}

const SCOPE_ORDER = { factory: 0, area: 1, machine: 2 } as const

function scopeRank(scope: CalendarExceptionScope) {
    if (scope.machineId) return SCOPE_ORDER.machine
    if (scope.areaId) return SCOPE_ORDER.area
    return SCOPE_ORDER.factory
}

// ---- Doğrulama ----

export type CalendarExceptionIssueCode =
    | "INVALID_START"
    | "INVALID_END"
    | "END_BEFORE_START"
    | "TOO_LONG"
    | "AMBIGUOUS_SCOPE"

export type CalendarExceptionIssue = {
    code: CalendarExceptionIssueCode
    message: string
}

/** Bitiş boşsa tek günlük kayıttır. */
export function findCalendarExceptionIssues(input: {
    startDate: string
    endDate?: string | null
    areaId?: string | null
    machineId?: string | null
}): CalendarExceptionIssue[] {
    const issues: CalendarExceptionIssue[] = []
    const endDate = input.endDate || input.startDate

    if (input.areaId && input.machineId) {
        issues.push({
            code: "AMBIGUOUS_SCOPE",
            message: "Kapsam ya bir alan ya da bir makine olabilir; ikisi birden seçilemez.",
        })
    }

    if (!isValidDateKey(input.startDate)) {
        issues.push({ code: "INVALID_START", message: "Başlangıç tarihi geçersiz." })
        return issues
    }
    if (!isValidDateKey(endDate)) {
        issues.push({ code: "INVALID_END", message: "Bitiş tarihi geçersiz." })
        return issues
    }

    const span = daysBetweenDateKeys(input.startDate, endDate)
    if (span < 0) {
        issues.push({ code: "END_BEFORE_START", message: "Bitiş tarihi başlangıçtan önce olamaz." })
    } else if (span + 1 > MAX_CALENDAR_EXCEPTION_DAYS) {
        issues.push({
            code: "TOO_LONG",
            message: `Bir kayıt en fazla ${MAX_CALENDAR_EXCEPTION_DAYS} gün olabilir; daha uzun dönemi parçalara bölün.`,
        })
    }

    return issues
}

// ---- Listede birleştirme ----

export type CalendarExceptionDay = CalendarExceptionScope & {
    id: string
    /** "YYYY-MM-DD" */
    date: string
    kind: CalendarExceptionKind
    note: string | null
}

export type CalendarExceptionGroup<TDay extends CalendarExceptionDay = CalendarExceptionDay> =
    CalendarExceptionScope & {
        key: string
        ids: string[]
        days: TDay[]
        startDate: string
        endDate: string
        dayCount: number
        kind: CalendarExceptionKind
        note: string | null
    }

function sameEntry(a: CalendarExceptionDay, b: CalendarExceptionDay) {
    return (
        calendarExceptionScopeKey(a) === calendarExceptionScopeKey(b)
        && a.kind === b.kind
        && (a.note ?? "") === (b.note ?? "")
    )
}

/**
 * Ardışık günleri, türü + notu + kapsamı aynıysa tek satırda birleştirir. Sıra:
 * başlangıç tarihi, sonra kapsam (fabrika → alan → makine). Birleştirme yalnız
 * gösterim içindir; kayıtlar gün başına kalır.
 */
export function groupCalendarExceptionDays<TDay extends CalendarExceptionDay>(
    days: TDay[],
): CalendarExceptionGroup<TDay>[] {
    const sorted = [...days].sort((a, b) => {
        const byEntry = `${calendarExceptionScopeKey(a)}|${a.kind}|${a.note ?? ""}`
            .localeCompare(`${calendarExceptionScopeKey(b)}|${b.kind}|${b.note ?? ""}`)
        return byEntry !== 0 ? byEntry : a.date.localeCompare(b.date)
    })

    const groups: CalendarExceptionGroup<TDay>[] = []
    let current: CalendarExceptionGroup<TDay> | null = null

    for (const day of sorted) {
        const continues = current !== null
            && sameEntry(current.days[current.days.length - 1], day)
            && addDaysToDateKey(current.endDate, 1) === day.date

        if (current && continues) {
            current.ids.push(day.id)
            current.days.push(day)
            current.endDate = day.date
            current.dayCount += 1
            continue
        }

        current = {
            key: `${calendarExceptionScopeKey(day)}|${day.date}`,
            ids: [day.id],
            days: [day],
            startDate: day.date,
            endDate: day.date,
            dayCount: 1,
            kind: day.kind,
            note: day.note,
            areaId: day.areaId,
            machineId: day.machineId,
        }
        groups.push(current)
    }

    return groups.sort((a, b) => (
        a.startDate.localeCompare(b.startDate)
        || scopeRank(a) - scopeRank(b)
        || a.key.localeCompare(b.key)
    ))
}
