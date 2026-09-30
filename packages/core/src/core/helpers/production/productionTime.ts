/**
 * Fabrika saati — SAF modül: I/O yok, import yok (frontend `@core/…` ile okur).
 *
 * Üretim zamanları (duruş; ileride iş ve lot) veritabanında UTC saklanır, ekranda ve
 * formda FABRİKANIN duvar saatiyle girilir ve gösterilir. Tarayıcının yerel saat
 * dilimine GÜVENİLMEZ: planlayıcı başka dilimdeki bir bilgisayardan girse de fabrikada
 * 08:00, 08:00'dir. Dönüşüm `Intl` ile yapılır (yeni bağımlılık yok) ve dilimin kuralı
 * değişse de (ör. yaz saati geri gelse) doğru kalır; +03:00 sabit olarak YAZILMAZ.
 */

/** Vardiya düzeninin varsayılan dilimiyle aynı (`ShiftPattern.timezone`). */
export const PRODUCTION_TIME_ZONE = "Europe/Istanbul"

const WALL_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

type WallParts = {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string) {
    let formatter = formatterCache.get(timeZone)
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        formatterCache.set(timeZone, formatter)
    }
    return formatter
}

function wallPartsAt(instant: Date, timeZone: string): WallParts {
    const values: Record<string, number> = {}
    for (const part of partsFormatter(timeZone).formatToParts(instant)) {
        if (part.type !== "literal") values[part.type] = Number(part.value)
    }
    return {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute,
        second: values.second,
    }
}

const pad2 = (value: number) => String(value).padStart(2, "0")

/** Dilimin o andaki UTC farkı (ms) — İstanbul için +3 saat. */
export function timeZoneOffsetMs(instant: Date, timeZone: string = PRODUCTION_TIME_ZONE): number {
    const parts = wallPartsAt(instant, timeZone)
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/**
 * Fabrika duvar saati → UTC anı. Girdi `<input type="datetime-local">` biçimidir
 * ("2026-09-28T08:00"); geçersizse `null`.
 */
export function wallTimeToUtc(wallTime: string, timeZone: string = PRODUCTION_TIME_ZONE): Date | null {
    const match = WALL_TIME_PATTERN.exec(wallTime)
    if (!match) return null

    const [year, month, day, hour, minute] = match.slice(1).map(Number)
    if (hour > 23 || minute > 59) return null

    const guess = Date.UTC(year, month - 1, day, hour, minute)
    const check = new Date(guess)
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        return null
    }

    // Fark, sonucun kendi anında yeniden ölçülür: dilim kuralı o gün değişiyorsa ilk tahmin kayar.
    const firstOffset = timeZoneOffsetMs(new Date(guess), timeZone)
    let result = guess - firstOffset
    const secondOffset = timeZoneOffsetMs(new Date(result), timeZone)
    if (secondOffset !== firstOffset) result = guess - secondOffset

    return new Date(result)
}

/** UTC anı → fabrika duvar saati ("2026-09-28T08:00", datetime-local girdisinin biçimi). */
export function utcToWallTime(instant: Date | string, timeZone: string = PRODUCTION_TIME_ZONE): string {
    const parts = wallPartsAt(typeof instant === "string" ? new Date(instant) : instant, timeZone)
    return `${String(parts.year).padStart(4, "0")}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`
}

/** Fabrikada o anın takvim günü ("2026-09-25"). */
export function productionDateKey(instant: Date = new Date(), timeZone: string = PRODUCTION_TIME_ZONE): string {
    return utcToWallTime(instant, timeZone).slice(0, 10)
}

/** "28.09.2026 08:00" — fabrika saatiyle. */
export function formatProductionDateTime(instant: Date | string, timeZone: string = PRODUCTION_TIME_ZONE): string {
    const wall = utcToWallTime(instant, timeZone)
    return `${wall.slice(8, 10)}.${wall.slice(5, 7)}.${wall.slice(0, 4)} ${wall.slice(11, 16)}`
}

/** Yıl olmadan kısa biçim: "28.09 08:00" — liste satırlarındaki uyarılar için. */
export function formatProductionShortDateTime(instant: Date | string, timeZone: string = PRODUCTION_TIME_ZONE): string {
    const full = formatProductionDateTime(instant, timeZone)
    return `${full.slice(0, 5)} ${full.slice(11)}`
}

/**
 * Bir zaman aralığının kısa okunuşu: aynı gün içindeyse bitişte yalnız saat yazılır
 * ("28.09.2026 08:00 – 16:00"), değilse iki uç tam yazılır.
 */
export function formatProductionTimeRange(
    startAt: Date | string,
    endAt: Date | string,
    timeZone: string = PRODUCTION_TIME_ZONE,
): string {
    const start = formatProductionDateTime(startAt, timeZone)
    const end = formatProductionDateTime(endAt, timeZone)
    return start.slice(0, 10) === end.slice(0, 10) ? `${start} – ${end.slice(11)}` : `${start} – ${end}`
}

/**
 * ÇALIŞMA süresi okunuşu: "45 dk", "8 sa 30 dk", "34 sa 6 dk" — gün yok. Makinenin fiilen çalıştığı
 * süre için (bağlama + üretim, net çalışma): 24 saati "1 gün" yazmak, günde 12 saat çalışan fabrikada
 * işin olduğundan kısa sürede biteceği izlenimini veriyordu. Takvim aralığı için `formatDurationMinutes`.
 */
export function formatWorkMinutes(totalMinutes: number): string {
    const minutes = Math.max(0, Math.round(totalMinutes))
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    if (hours === 0) return `${rest} dk`
    return rest > 0 ? `${hours} sa ${rest} dk` : `${hours} sa`
}

/** TAKVİM süresi okunuşu (geceler, tatiller dahil): "45 dk", "8 sa 30 dk", "2 gün 4 sa". */
export function formatDurationMinutes(totalMinutes: number): string {
    const minutes = Math.max(0, Math.round(totalMinutes))
    const days = Math.floor(minutes / (24 * 60))
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    const rest = minutes % 60

    const parts: string[] = []
    if (days > 0) parts.push(`${days} gün`)
    if (hours > 0) parts.push(`${hours} sa`)
    // Gün mertebesinde dakika gürültüdür; saatin altındaysa tek bilgi odur.
    if (rest > 0 && days === 0) parts.push(`${rest} dk`)

    return parts.length > 0 ? parts.join(" ") : "0 dk"
}
