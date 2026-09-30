/**
 * Vardiya EKİBİ — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 *  - Atama makine × vardiya günü × vardiya koduna yapılır (hücre); o hücrede üretilen lot ekibini
 *    buradan alır. Bir operatör aynı vardiyada birden çok makineye bakabilir.
 *  - Hücre, makinenin o gün GERÇEKTEN çalışan bir vardiyası olmalı (düzen + takvim istisnası —
 *    `shiftCalendar`). Hücreyi boşaltmak her zaman serbest: düzen değişince ya da sonradan tatil
 *    eklenince kalan "düzen dışı" atamalar temizlenebilsin.
 *  - Pasif operatör yeni atamada seçilemez; hücrede zaten varsa kalabilir.
 *  - Kopyalama: kaynak günün ekibi hedef günlere yazılır; hedef günlerin ekibi TAMAMEN değişir,
 *    hedefte o makine o vardiyada çalışmıyorsa atama atlanır, pasif operatör kopyalanmaz.
 */
import type { BoardMachineInput, BoardShiftPattern } from "./productionBoard"
import { daysBetweenDateKeys, isValidDateKey, type CalendarExceptionKind } from "./productionCalendar"
import { buildShiftInstances, resolveWorkdayException, type CalendarExceptionForDay } from "./shiftCalendar"
import { resolveEffectiveShiftPattern } from "./shiftPatterns"

export const MAX_OPERATORS_PER_SHIFT_CELL = 10
export const MAX_ROSTER_COPY_DAYS = 31

export type RosterShift = { code: string; name: string; startAt: Date; endAt: Date }

export type RosterMachineDay = {
    machineId: string
    shiftPatternName: string | null
    /** O günün istisnası (makine > alan > fabrika); tatil / toplu izinde `shifts` boştur. */
    exception: CalendarExceptionKind | null
    shifts: RosterShift[]
}

/** Makinelerin o vardiya GÜNÜNDEKİ vardiyaları (gece vardiyası dahil, kırpılmadan). */
export function buildRosterDay(input: {
    machines: BoardMachineInput[]
    areaShiftPatternIds: Record<string, string | null>
    patterns: BoardShiftPattern[]
    exceptions: CalendarExceptionForDay[]
    date: string
}): RosterMachineDay[] {
    const patternById = new Map(input.patterns.map((pattern) => [pattern.id, pattern]))
    const defaultPatternId = input.patterns.find((pattern) => pattern.isDefault)?.id ?? null

    return input.machines.map((machine) => {
        const effective = resolveEffectiveShiftPattern({
            machineShiftPatternId: machine.shiftPatternId,
            areaShiftPatternId: input.areaShiftPatternIds[machine.areaId] ?? null,
            defaultShiftPatternId: defaultPatternId,
        })
        const pattern = effective.patternId ? patternById.get(effective.patternId) : undefined
        const instances = pattern
            ? buildShiftInstances({
                shifts: pattern.shifts,
                fromWorkday: input.date,
                toWorkday: input.date,
                exceptions: input.exceptions,
                machineId: machine.id,
                areaId: machine.areaId,
                timeZone: pattern.timezone,
            })
            : []
        return {
            machineId: machine.id,
            shiftPatternName: pattern?.name ?? null,
            exception: resolveWorkdayException(input.date, input.exceptions, { machineId: machine.id, areaId: machine.areaId }),
            shifts: instances.map((instance) => ({
                code: instance.shiftCode,
                name: instance.shiftName,
                startAt: instance.startAt,
                endAt: instance.endAt,
            })),
        }
    })
}

export type OperatorChoice = { id: string; firstName: string; lastName: string; isActive: boolean }

/**
 * Ekip seçimi (vardiya hücresi ya da lota özel ekip): tekrar yok, sınır, bilinen operatör; pasif
 * operatör yalnız zaten seçiliyse kalabilir. Geçerliyse `null`.
 */
export function findOperatorSelectionIssue(input: {
    operatorIds: string[]
    operators: OperatorChoice[]
    alreadySelectedIds: string[]
    max: number
}): string | null {
    if (new Set(input.operatorIds).size !== input.operatorIds.length) return "Aynı operatör iki kez seçilmiş."
    if (input.operatorIds.length > input.max) return `En fazla ${input.max} operatör seçilebilir.`
    const byId = new Map(input.operators.map((operator) => [operator.id, operator]))
    for (const id of input.operatorIds) {
        const operator = byId.get(id)
        if (!operator) return "Seçilen operatörlerden biri bulunamadı."
        if (!operator.isActive && !input.alreadySelectedIds.includes(id)) {
            return `${operator.firstName} ${operator.lastName} pasif; yeni atamada seçilemez.`
        }
    }
    return null
}

/** Kopyalama aralığı geçersizse Türkçe mesaj, geçerliyse `null`. */
export function findRosterCopyIssue(input: { fromDate: string; toStart: string; toEnd: string }): string | null {
    if (![input.fromDate, input.toStart, input.toEnd].every(isValidDateKey)) return "Tarihler YYYY-AA-GG biçiminde olmalı."
    const days = daysBetweenDateKeys(input.toStart, input.toEnd) + 1
    if (days < 1) return "Bitiş tarihi başlangıçtan önce olamaz."
    if (days > MAX_ROSTER_COPY_DAYS) return `En fazla ${MAX_ROSTER_COPY_DAYS} güne kopyalanabilir.`
    if (input.fromDate >= input.toStart && input.fromDate <= input.toEnd) return "Kaynak gün hedef aralığın içinde olamaz."
    return null
}

export type RosterRow = { machineId: string; shiftDate: string; shiftCode: string; operatorId: string }

/** Kaynak günün atamaları → hedef günlerde yazılacak satırlar (çalışılmayan hücre ve pasif operatör atlanır). */
export function planRosterCopy(input: {
    source: Array<{ machineId: string; shiftCode: string; operatorId: string }>
    targetDays: Array<{ date: string; machines: RosterMachineDay[] }>
    activeOperatorIds: Set<string>
}): RosterRow[] {
    const rows: RosterRow[] = []
    for (const day of input.targetDays) {
        const cells = new Set(day.machines.flatMap((machine) => machine.shifts.map((shift) => `${machine.machineId}|${shift.code}`)))
        for (const assignment of input.source) {
            if (!input.activeOperatorIds.has(assignment.operatorId)) continue
            if (!cells.has(`${assignment.machineId}|${assignment.shiftCode}`)) continue
            rows.push({ machineId: assignment.machineId, shiftDate: day.date, shiftCode: assignment.shiftCode, operatorId: assignment.operatorId })
        }
    }
    return rows
}
