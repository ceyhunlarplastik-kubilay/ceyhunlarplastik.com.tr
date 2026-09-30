/**
 * Makinenin ÇALIŞMA PENCERELERİ — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 * Vardiya düzeni haftalık kalıbı verir; takvim istisnası günü açar/kapatır; duruş
 * pencereleri çalışma zamanından düşülür. Sonuç, fabrika saatiyle kurulmuş gerçek
 * anlardır (UTC `Date`).
 *
 *  - Vardiya günü = düzenin ilk vardiyasının başladığı gün; gece vardiyası o güne aittir
 *    (`shiftPatterns.ts`). İstisna da vardiya GÜNÜNE uygulanır: Cuma tatilse Cuma'nın
 *    gece vardiyası da (Cumartesi 00:00'da başlasa bile) çalışmaz.
 *  - İstisna önceliği: makine > alan > fabrika. Tatil / toplu izin → o gün hiç vardiya
 *    yok; ek mesai → düzenin tüm vardiyaları `daysOfWeek`'e bakılmadan çalışır.
 *  - Duruş yarı açık aralıktır [başlangıç, bitiş); pencereyi kırpar ya da ikiye böler.
 */
import {
    addDaysToDateKey,
    daysBetweenDateKeys,
    weekdayOfDateKey,
    type CalendarExceptionKind,
} from "./productionCalendar"
import { productionDateKey, PRODUCTION_TIME_ZONE, wallTimeToUtc } from "./productionTime"
import {
    buildShiftTimeline,
    MINUTES_PER_DAY,
    normalizeShiftDefinitions,
    type ShiftDefinitionInput,
} from "./shiftPatterns"

export type CalendarExceptionForDay = {
    /** "YYYY-MM-DD" (vardiya günü) */
    date: string
    kind: CalendarExceptionKind
    areaId: string | null
    machineId: string | null
}

export type DowntimeInterval = { startAt: Date; endAt: Date }

export type WorkingWindow = {
    /** Vardiya günü ("YYYY-MM-DD") — lot bu güne ve vardiya koduna göre açılır. */
    workday: string
    shiftCode: string
    shiftName: string
    startAt: Date
    endAt: Date
}

const MINUTE_MS = 60_000

/** O gün için geçerli istisna türü — makine > alan > fabrika; yoksa `null`. */
export function resolveWorkdayException(
    date: string,
    exceptions: CalendarExceptionForDay[],
    scope: { machineId: string; areaId: string | null },
): CalendarExceptionKind | null {
    const sameDay = exceptions.filter((exception) => exception.date === date)
    const forMachine = sameDay.find((exception) => exception.machineId === scope.machineId)
    if (forMachine) return forMachine.kind
    const forArea = scope.areaId ? sameDay.find((exception) => exception.areaId === scope.areaId && !exception.machineId) : undefined
    if (forArea) return forArea.kind
    return sameDay.find((exception) => !exception.areaId && !exception.machineId)?.kind ?? null
}

function wallMinuteToUtc(dateKey: string, minuteFromMidnight: number, timeZone: string): Date {
    const dayOffset = Math.floor(minuteFromMidnight / MINUTES_PER_DAY)
    const minute = minuteFromMidnight - dayOffset * MINUTES_PER_DAY
    const hh = String(Math.floor(minute / 60)).padStart(2, "0")
    const mm = String(minute % 60).padStart(2, "0")
    const date = wallTimeToUtc(`${addDaysToDateKey(dateKey, dayOffset)}T${hh}:${mm}`, timeZone)
    if (!date) throw new Error(`Geçersiz vardiya zamanı: ${dateKey} ${minuteFromMidnight}`)
    return date
}

/** Vardiya günleri [fromWorkday, toWorkday] için vardiya örnekleri (duruş düşülmeden). */
export function buildShiftInstances(input: {
    shifts: Array<ShiftDefinitionInput & { sortOrder?: number }>
    fromWorkday: string
    toWorkday: string
    exceptions: CalendarExceptionForDay[]
    machineId: string
    areaId: string | null
    timeZone?: string
}): WorkingWindow[] {
    const timeZone = input.timeZone ?? PRODUCTION_TIME_ZONE
    // Normalleştirme sırayı dizideki konumdan alır: ilk vardiya (vardiya günü) `sortOrder`'a göre.
    const ordered = [...input.shifts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const timeline = buildShiftTimeline(normalizeShiftDefinitions(ordered))
    if (timeline.length === 0) return []

    const anchorStart = timeline.find((entry) => entry.offsetStart === 0)?.shift.startMinute ?? timeline[0].shift.startMinute
    const dayCount = daysBetweenDateKeys(input.fromWorkday, input.toWorkday) + 1
    const instances: WorkingWindow[] = []

    for (let index = 0; index < dayCount; index += 1) {
        const workday = addDaysToDateKey(input.fromWorkday, index)
        const exception = resolveWorkdayException(workday, input.exceptions, input)
        if (exception === "HOLIDAY" || exception === "SHUTDOWN") continue

        const weekday = weekdayOfDateKey(workday)
        for (const entry of timeline) {
            if (exception !== "EXTRA_WORKDAY" && !entry.shift.daysOfWeek.includes(weekday)) continue
            const startAt = wallMinuteToUtc(workday, anchorStart + entry.offsetStart, timeZone)
            instances.push({
                workday,
                shiftCode: entry.shift.code,
                shiftName: entry.shift.name,
                startAt,
                endAt: new Date(startAt.getTime() + entry.shift.durationMinutes * MINUTE_MS),
            })
        }
    }

    return instances.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}

/** Duruşları pencerelerden düşer (kırpar ya da böler); boş kalan parça atılır. */
export function subtractDowntimes(windows: WorkingWindow[], downtimes: DowntimeInterval[]): WorkingWindow[] {
    let result = windows
    for (const downtime of downtimes) {
        const next: WorkingWindow[] = []
        for (const window of result) {
            const overlaps = downtime.startAt < window.endAt && window.startAt < downtime.endAt
            if (!overlaps) {
                next.push(window)
                continue
            }
            if (window.startAt < downtime.startAt) next.push({ ...window, endAt: downtime.startAt })
            if (downtime.endAt < window.endAt) next.push({ ...window, startAt: downtime.endAt })
        }
        result = next
    }
    return result
}

/**
 * [from, to) aralığındaki çalışma pencereleri. Vardiya günü `from`'un bir gün öncesinden
 * başlatılır: önceki günün gece vardiyası `from` anında sürüyor olabilir.
 */
export function buildWorkingWindows(input: {
    shifts: Array<ShiftDefinitionInput & { sortOrder?: number }>
    from: Date
    to: Date
    exceptions: CalendarExceptionForDay[]
    downtimes: DowntimeInterval[]
    machineId: string
    areaId: string | null
    timeZone?: string
}): WorkingWindow[] {
    const timeZone = input.timeZone ?? PRODUCTION_TIME_ZONE
    const instances = buildShiftInstances({
        ...input,
        timeZone,
        fromWorkday: addDaysToDateKey(productionDateKey(input.from, timeZone), -1),
        toWorkday: productionDateKey(input.to, timeZone),
    })

    const clipped = instances
        .filter((window) => window.endAt > input.from && window.startAt < input.to)
        .map((window) => ({
            ...window,
            startAt: window.startAt < input.from ? input.from : window.startAt,
            endAt: window.endAt > input.to ? input.to : window.endAt,
        }))

    return subtractDowntimes(clipped, input.downtimes).filter((window) => window.endAt > window.startAt)
}
