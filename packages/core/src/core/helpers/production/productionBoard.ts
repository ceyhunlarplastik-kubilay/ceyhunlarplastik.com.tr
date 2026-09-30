/**
 * Planlama TAHTASI — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 * Tahta bir tarih penceresini (fabrika takviminde gün anahtarları, iki uç dahil) makine
 * satırları hâlinde çizer. Buradaki kurallar hem Lambda'nın hem tarayıcının kullandığı
 * tek kaynaktır: pencere sınırı, pencerenin gerçek anları ve makine başına vardiya
 * örnekleri (duruş DÜŞÜLMEDEN — duruşlar tahtada ayrı blok olarak çizilir).
 */
import {
    addDaysToDateKey,
    daysBetweenDateKeys,
    enumerateDateKeys,
    isValidDateKey,
    type CalendarExceptionKind,
} from "./productionCalendar"
import { PRODUCTION_TIME_ZONE, wallTimeToUtc } from "./productionTime"
import type { CompatibilityLevel } from "./moldMachineCompatibility"
import { buildWorkingWindows, resolveWorkdayException, type CalendarExceptionForDay } from "./shiftCalendar"
import { resolveEffectiveShiftPattern, type ShiftDefinitionInput } from "./shiftPatterns"

/** Tahtanın gösterebileceği en uzun pencere (gün). */
export const MAX_BOARD_DAYS = 31
/** Varsayılan pencere: bugün + 6 gün. */
export const DEFAULT_BOARD_DAYS = 7

export type BoardShiftPattern = {
    id: string
    name: string
    isDefault: boolean
    timezone: string
    shifts: Array<ShiftDefinitionInput & { sortOrder?: number }>
}

export type BoardMachineInput = { id: string; areaId: string; shiftPatternId: string | null }

export type BoardShift = { workday: string; shiftCode: string; shiftName: string; startAt: Date; endAt: Date }

export type BoardMachineCalendar = {
    machineId: string
    shiftPatternId: string | null
    shiftPatternName: string | null
    shifts: BoardShift[]
    /** Pencerede istisnası olan günler (makine > alan > fabrika önceliğiyle çözülmüş). */
    dayExceptions: Array<{ date: string; kind: CalendarExceptionKind }>
}

/** Makinenin geçerli vardiya düzeni: makine > alan > varsayılan (planlama motoruyla aynı). */
export function resolveMachinePattern<T extends BoardShiftPattern>(
    machine: BoardMachineInput,
    areaShiftPatternIds: Record<string, string | null>,
    patterns: T[],
): T | undefined {
    const effective = resolveEffectiveShiftPattern({
        machineShiftPatternId: machine.shiftPatternId,
        areaShiftPatternId: areaShiftPatternIds[machine.areaId] ?? null,
        defaultShiftPatternId: patterns.find((pattern) => pattern.isDefault)?.id ?? null,
    })
    return effective.patternId ? patterns.find((pattern) => pattern.id === effective.patternId) : undefined
}

/** Pencere geçersizse Türkçe mesaj, geçerliyse `null`. */
export function findBoardRangeIssue(from: string, to: string): string | null {
    if (!isValidDateKey(from) || !isValidDateKey(to)) return "Tarih aralığı YYYY-AA-GG biçiminde olmalı."
    const days = daysBetweenDateKeys(from, to) + 1
    if (days < 1) return "Bitiş tarihi başlangıçtan önce olamaz."
    if (days > MAX_BOARD_DAYS) return `Tahta en fazla ${MAX_BOARD_DAYS} gün gösterebilir.`
    return null
}

/** Pencerenin gerçek anları: `from` günü 00:00 → `to` gününün ertesi 00:00 (fabrika saati). */
export function boardRangeInstants(from: string, to: string, timeZone: string = PRODUCTION_TIME_ZONE) {
    const start = wallTimeToUtc(`${from}T00:00`, timeZone)
    const end = wallTimeToUtc(`${addDaysToDateKey(to, 1)}T00:00`, timeZone)
    if (!start || !end) throw new Error(`Geçersiz tahta aralığı: ${from}..${to}`)
    return { start, end }
}

/**
 * Makine başına vardiya örnekleri + gün istisnaları. Etkin düzen makine > alan > varsayılan;
 * düzeni olmayan makinenin `shifts`'i boştur (tahtada "vardiya düzeni yok" olarak görünür).
 */
export function buildBoardMachineCalendars(input: {
    machines: BoardMachineInput[]
    areaShiftPatternIds: Record<string, string | null>
    patterns: BoardShiftPattern[]
    exceptions: CalendarExceptionForDay[]
    from: string
    to: string
}): BoardMachineCalendar[] {
    const dates = enumerateDateKeys(input.from, input.to)

    return input.machines.map((machine) => {
        const pattern = resolveMachinePattern(machine, input.areaShiftPatternIds, input.patterns)
        const range = boardRangeInstants(input.from, input.to, pattern?.timezone ?? PRODUCTION_TIME_ZONE)
        const shifts = pattern
            ? buildWorkingWindows({
                shifts: pattern.shifts,
                from: range.start,
                to: range.end,
                exceptions: input.exceptions,
                downtimes: [],
                machineId: machine.id,
                areaId: machine.areaId,
                timeZone: pattern.timezone,
            })
            : []

        const dayExceptions = dates.flatMap((date) => {
            const kind = resolveWorkdayException(date, input.exceptions, { machineId: machine.id, areaId: machine.areaId })
            return kind ? [{ date, kind }] : []
        })

        return {
            machineId: machine.id,
            shiftPatternId: pattern?.id ?? null,
            shiftPatternName: pattern?.name ?? null,
            shifts,
            dayExceptions,
        }
    })
}

const VERDICT_PREFERENCE: CompatibilityLevel[] = ["ok", "warning", "unknown", "error"]

/**
 * Emir kartı için makine hükmü: emrin ölçüsünü basan kalıplardan EN İYİSİ (bir kalıp uyuyorsa
 * makine uygundur; sunucu planlarken o makinede en erken biten kalıbı seçer). Kalıp yoksa hata.
 */
export function bestCompatibilityVerdict(verdicts: CompatibilityLevel[]): CompatibilityLevel {
    for (const level of VERDICT_PREFERENCE) {
        if (verdicts.includes(level)) return level
    }
    return "error"
}
