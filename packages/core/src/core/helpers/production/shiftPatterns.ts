/**
 * Vardiya düzeni kuralları — SAF modül: I/O yok, import yok. Backend doğrulaması ile
 * frontend'in canlı özeti (`@core/helpers/production/shiftPatterns`) AYNI fonksiyondan
 * geçer; kural iki yerde ayrışamaz.
 *
 * Kavramlar
 *  - Düzen, makinenin günde kaç saat çalıştığını tanımlar (12 / 16 / 24 saat); günlük
 *    süre, o gün çalışan vardiyaların toplamıdır.
 *  - VARDİYA GÜNÜ, düzenin ilk vardiyasının (listede ilk sıradaki) başladığı takvim
 *    günüdür. Saati ilk vardiyadan ÖNCE olan vardiya ertesi takvim gününe düşer:
 *    A 08:00, B 16:00, C 00:00 düzeninde C, A'nın gününün gece devamıdır.
 *  - `daysOfWeek` vardiya gününe göredir (1 = Pazartesi … 7 = Pazar): Cuma'nın C
 *    vardiyası Cumartesi 00:00'da başlar ama Cuma'ya aittir.
 *  - Bir düzendeki vardiyalar örtüşemez ve vardiya günü 24 saati aşamaz.
 */

export const MINUTES_PER_DAY = 24 * 60
export const MAX_SHIFTS_PER_PATTERN = 4
export const MIN_SHIFT_MINUTES = 30
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
/** Hazır şablonların varsayılan çalışma günleri: Pazartesi–Cumartesi. */
export const DEFAULT_WORKDAYS = [1, 2, 3, 4, 5, 6]

const WEEKDAY_SHORT_LABELS: Record<number, string> = {
    1: "Pzt",
    2: "Sal",
    3: "Çar",
    4: "Per",
    5: "Cum",
    6: "Cmt",
    7: "Paz",
}

export type ShiftDefinitionInput = {
    code: string
    name: string
    startMinute: number
    durationMinutes: number
    daysOfWeek: number[]
}

export type NormalizedShiftDefinition = ShiftDefinitionInput & { sortOrder: number }

export type ShiftPatternIssueCode =
    | "NO_SHIFTS"
    | "TOO_MANY_SHIFTS"
    | "EMPTY_CODE"
    | "EMPTY_NAME"
    | "DUPLICATE_CODE"
    | "INVALID_START"
    | "INVALID_DURATION"
    | "NO_DAYS"
    | "INVALID_DAY"
    | "OVERLAP"
    | "EXCEEDS_DAY"

export type ShiftPatternIssue = {
    code: ShiftPatternIssueCode
    message: string
    shiftCode?: string
}

export type ShiftTimelineEntry = {
    shift: NormalizedShiftDefinition
    /** Vardiya gününün başından (ilk vardiyanın başlangıcı) itibaren dakika. */
    offsetStart: number
    offsetEnd: number
    /** Takvimde ertesi güne düşüyor mu (gece vardiyası). */
    startsNextDay: boolean
}

export type ShiftPatternSummary = {
    /** Vardiya günü başına çalışılan dakika — anahtar 1 (Pzt) … 7 (Paz). */
    minutesByWeekday: Record<number, number>
    /** En uzun çalışma günü (dakika) — "günde 24 saat" etiketi buradan. */
    maxDailyMinutes: number
    workingWeekdays: number[]
    weeklyMinutes: number
}

export type ShiftPatternPreset = {
    key: string
    label: string
    dailyHours: number
    shifts: ShiftDefinitionInput[]
}

/** Boşlukları kırpar, kodu büyük harfe çevirir, günleri tekilleştirip sıralar. */
export function normalizeShiftDefinitions(shifts: ShiftDefinitionInput[]): NormalizedShiftDefinition[] {
    return shifts.map((shift, index) => ({
        code: shift.code.trim().toUpperCase(),
        name: shift.name.trim(),
        startMinute: shift.startMinute,
        durationMinutes: shift.durationMinutes,
        daysOfWeek: Array.from(new Set(shift.daysOfWeek)).sort((a, b) => a - b),
        sortOrder: index,
    }))
}

/** Vardiyaları vardiya günü içindeki gerçek sırasına dizer. */
export function buildShiftTimeline(shifts: NormalizedShiftDefinition[]): ShiftTimelineEntry[] {
    if (shifts.length === 0) return []

    const ordered = [...shifts].sort((a, b) => a.sortOrder - b.sortOrder)
    const anchorStart = ordered[0].startMinute

    return ordered
        .map((shift) => {
            const offsetStart = (shift.startMinute - anchorStart + MINUTES_PER_DAY) % MINUTES_PER_DAY
            return {
                shift,
                offsetStart,
                offsetEnd: offsetStart + shift.durationMinutes,
                startsNextDay: shift.startMinute < anchorStart,
            }
        })
        .sort((a, b) => a.offsetStart - b.offsetStart)
}

/** Boş dizi = düzen geçerli. Mesajlar kullanıcıya gösterilir. */
export function findShiftPatternIssues(shifts: NormalizedShiftDefinition[]): ShiftPatternIssue[] {
    const issues: ShiftPatternIssue[] = []

    if (shifts.length === 0) {
        return [{ code: "NO_SHIFTS", message: "En az bir vardiya tanımlayın." }]
    }
    if (shifts.length > MAX_SHIFTS_PER_PATTERN) {
        issues.push({
            code: "TOO_MANY_SHIFTS",
            message: `Bir düzende en fazla ${MAX_SHIFTS_PER_PATTERN} vardiya olabilir.`,
        })
    }

    const seenCodes = new Set<string>()
    for (const shift of shifts) {
        const label = shift.code || `${shift.sortOrder + 1}. vardiya`

        if (!shift.code) {
            issues.push({ code: "EMPTY_CODE", message: `${label}: kod boş olamaz.` })
        } else if (seenCodes.has(shift.code)) {
            issues.push({ code: "DUPLICATE_CODE", shiftCode: shift.code, message: `${shift.code} kodu birden fazla vardiyada kullanılmış.` })
        }
        seenCodes.add(shift.code)

        if (!shift.name) {
            issues.push({ code: "EMPTY_NAME", shiftCode: shift.code, message: `${label}: ad boş olamaz.` })
        }
        if (!Number.isInteger(shift.startMinute) || shift.startMinute < 0 || shift.startMinute >= MINUTES_PER_DAY) {
            issues.push({ code: "INVALID_START", shiftCode: shift.code, message: `${label}: başlangıç saati 00:00–23:59 arasında olmalı.` })
        }
        if (
            !Number.isInteger(shift.durationMinutes)
            || shift.durationMinutes < MIN_SHIFT_MINUTES
            || shift.durationMinutes > MINUTES_PER_DAY
        ) {
            issues.push({ code: "INVALID_DURATION", shiftCode: shift.code, message: `${label}: süre 30 dakika ile 24 saat arasında olmalı.` })
        }
        if (shift.daysOfWeek.length === 0) {
            issues.push({ code: "NO_DAYS", shiftCode: shift.code, message: `${label}: en az bir çalışma günü seçin.` })
        } else if (shift.daysOfWeek.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
            issues.push({ code: "INVALID_DAY", shiftCode: shift.code, message: `${label}: geçersiz gün.` })
        }
    }

    // Zaman çizelgesi kontrolleri yalnız sayılar geçerliyse anlamlı.
    if (issues.length > 0) return issues

    const timeline = buildShiftTimeline(shifts)
    for (let index = 1; index < timeline.length; index += 1) {
        const previous = timeline[index - 1]
        const current = timeline[index]
        if (current.offsetStart < previous.offsetEnd) {
            issues.push({
                code: "OVERLAP",
                shiftCode: current.shift.code,
                message: `${previous.shift.code} ve ${current.shift.code} vardiyaları örtüşüyor.`,
            })
        }
    }

    const last = timeline[timeline.length - 1]
    if (last.offsetEnd > MINUTES_PER_DAY) {
        issues.push({
            code: "EXCEEDS_DAY",
            shiftCode: last.shift.code,
            message: `${last.shift.code} vardiyası ertesi günün ilk vardiyasına taşıyor — vardiya günü 24 saati aşamaz.`,
        })
    }

    return issues
}

export function summarizeShiftPattern(shifts: NormalizedShiftDefinition[]): ShiftPatternSummary {
    const minutesByWeekday: Record<number, number> = {}
    for (const day of WEEKDAYS) minutesByWeekday[day] = 0

    for (const shift of shifts) {
        for (const day of shift.daysOfWeek) {
            if (day in minutesByWeekday) minutesByWeekday[day] += shift.durationMinutes
        }
    }

    const workingWeekdays = WEEKDAYS.filter((day) => minutesByWeekday[day] > 0)
    const weeklyMinutes = WEEKDAYS.reduce((sum, day) => sum + minutesByWeekday[day], 0)

    return {
        minutesByWeekday,
        maxDailyMinutes: Math.max(0, ...WEEKDAYS.map((day) => minutesByWeekday[day])),
        workingWeekdays,
        weeklyMinutes,
    }
}

export type EffectiveShiftPattern = {
    patternId: string | null
    source: "machine" | "area" | "default" | null
}

/**
 * Makinenin geçerli vardiya düzeni: makinenin kendi seçimi → alanının seçimi →
 * varsayılan düzen. Tek kural — ekranlar ve planlama motoru bunu kullanır.
 */
export function resolveEffectiveShiftPattern(input: {
    machineShiftPatternId: string | null
    areaShiftPatternId: string | null
    defaultShiftPatternId: string | null
}): EffectiveShiftPattern {
    if (input.machineShiftPatternId) return { patternId: input.machineShiftPatternId, source: "machine" }
    if (input.areaShiftPatternId) return { patternId: input.areaShiftPatternId, source: "area" }
    if (input.defaultShiftPatternId) return { patternId: input.defaultShiftPatternId, source: "default" }
    return { patternId: null, source: null }
}

/** 480 → "08:00". 1440 → "24:00" (günün sonu). */
export function formatMinuteOfDay(minute: number): string {
    const safe = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minute)))
    const hours = Math.floor(safe / 60)
    const minutes = safe % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/** "08:00" → 480; biçim bozuksa null. */
export function parseMinuteOfDay(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
    if (!match) return null

    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (hours > 23 || minutes > 59) return null

    return hours * 60 + minutes
}

/** Vardiyanın saat aralığı: "08:00–16:00", gece yarısını geçerse "20:00–08:00". */
export function formatShiftRange(shift: Pick<ShiftDefinitionInput, "startMinute" | "durationMinutes">): string {
    const end = (shift.startMinute + shift.durationMinutes) % MINUTES_PER_DAY
    return `${formatMinuteOfDay(shift.startMinute)}–${formatMinuteOfDay(end)}`
}

/** [1,2,3,4,5,6] → "Pzt–Cmt", [1,3,5] → "Pzt, Çar, Cum", 7 gün → "Her gün". */
export function describeWeekdays(days: number[]): string {
    const sorted = Array.from(new Set(days)).filter((day) => day >= 1 && day <= 7).sort((a, b) => a - b)
    if (sorted.length === 0) return "—"
    if (sorted.length === 7) return "Her gün"

    const isContiguous = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1)
    if (isContiguous && sorted.length >= 3) {
        return `${WEEKDAY_SHORT_LABELS[sorted[0]]}–${WEEKDAY_SHORT_LABELS[sorted[sorted.length - 1]]}`
    }

    return sorted.map((day) => WEEKDAY_SHORT_LABELS[day]).join(", ")
}

export function weekdayShortLabel(day: number): string {
    return WEEKDAY_SHORT_LABELS[day] ?? String(day)
}

function presetShift(code: string, name: string, startHour: number, durationHours: number): ShiftDefinitionInput {
    return {
        code,
        name,
        startMinute: startHour * 60,
        durationMinutes: durationHours * 60,
        daysOfWeek: [...DEFAULT_WORKDAYS],
    }
}

/**
 * Hazır şablonlar — "günde kaç saat çalışıyoruz" sorusunun cevapları. Başlangıç
 * saatleri ve günler şablonu seçtikten sonra düzenlenebilir.
 */
export const SHIFT_PATTERN_PRESETS: ShiftPatternPreset[] = [
    {
        key: "24h-3x8",
        label: "Günde 24 saat · 3 × 8",
        dailyHours: 24,
        shifts: [presetShift("A", "Gündüz", 8, 8), presetShift("B", "Akşam", 16, 8), presetShift("C", "Gece", 0, 8)],
    },
    {
        key: "24h-2x12",
        label: "Günde 24 saat · 2 × 12",
        dailyHours: 24,
        shifts: [presetShift("A", "Gündüz", 8, 12), presetShift("B", "Gece", 20, 12)],
    },
    {
        key: "16h-2x8",
        label: "Günde 16 saat · 2 × 8",
        dailyHours: 16,
        shifts: [presetShift("A", "Gündüz", 8, 8), presetShift("B", "Akşam", 16, 8)],
    },
    {
        key: "12h-1x12",
        label: "Günde 12 saat · 1 × 12",
        dailyHours: 12,
        shifts: [presetShift("A", "Gündüz", 8, 12)],
    },
]
