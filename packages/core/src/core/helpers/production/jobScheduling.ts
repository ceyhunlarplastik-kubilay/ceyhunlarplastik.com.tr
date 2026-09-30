/**
 * Süre, ileri planlama ve vardiya lotları — SAF modül (yalnız göreli import).
 * Formüller docs/production-planning.md §6:
 *
 *   baskı      = ⌈ adet ÷ (göz × (1 − fire)) ⌉
 *   üretim_dk  = baskı × çevrim_sn ÷ 60 ÷ verim
 *   toplam     = bağlama_dk + üretim_dk  → çalışma pencerelerine yayılır
 *
 * Çevrim zinciri (ilk bulunan kazanır): emirdeki elle çevrim → kalıp-makine kartı →
 * kalıbın referans çevrimi × hammadde katsayısı.
 */
import type { WorkingWindow } from "./shiftCalendar"

const MINUTE_MS = 60_000

export type CycleTimeSource = "order" | "machineCard" | "mold"

export function resolveCycleTimeSec(input: {
    orderOverrideSec?: number | null
    machineCardSec?: number | null
    moldStandardSec: number
    materialFactor?: number | null
}): { cycleTimeSec: number; source: CycleTimeSource } {
    if (input.orderOverrideSec != null && input.orderOverrideSec > 0) {
        return { cycleTimeSec: input.orderOverrideSec, source: "order" }
    }
    if (input.machineCardSec != null && input.machineCardSec > 0) {
        return { cycleTimeSec: input.machineCardSec, source: "machineCard" }
    }
    const factor = input.materialFactor != null && input.materialFactor > 0 ? input.materialFactor : 1
    return { cycleTimeSec: Math.round(input.moldStandardSec * factor * 100) / 100, source: "mold" }
}

/** Hedef SAĞLAM adet için gereken baskı sayısı (fire dahil). */
export function computeShotCount(input: { quantity: number; cavities: number; scrapPercent: number }): number {
    const goodPerShot = input.cavities * (1 - Math.min(Math.max(input.scrapPercent, 0), 99) / 100)
    return Math.ceil(input.quantity / goodPerShot)
}

/** Verim düşülmüş gerçek üretim süresi (dk). */
export function computeProductionMinutes(input: { shots: number; cycleTimeSec: number; efficiencyPercent: number }): number {
    const efficiency = Math.min(Math.max(input.efficiencyPercent, 1), 100) / 100
    return (input.shots * input.cycleTimeSec) / 60 / efficiency
}

export type ScheduleSegment = {
    kind: "setup" | "production"
    workday: string
    shiftCode: string
    startAt: Date
    endAt: Date
    minutes: number
}

export type ForwardSchedule = {
    setupStartAt: Date
    productionStartAt: Date
    endAt: Date
    segments: ScheduleSegment[]
}

/**
 * İşi `earliestStart`'tan itibaren çalışma pencerelerine yayar: önce bağlama, sonra üretim;
 * pencere aralarında (vardiya yok, tatil, duruş) iş bekler. Pencereler yetmezse `null`.
 */
export function scheduleForward(input: {
    windows: WorkingWindow[]
    earliestStart: Date
    setupMinutes: number
    productionMinutes: number
}): ForwardSchedule | null {
    const allPhases: Array<{ kind: ScheduleSegment["kind"]; remaining: number }> = [
        { kind: "setup", remaining: Math.max(0, input.setupMinutes) },
        { kind: "production", remaining: Math.max(0, input.productionMinutes) },
    ]
    const phases = allPhases.filter((phase) => phase.remaining > 0)
    if (phases.length === 0) return null

    const segments: ScheduleSegment[] = []
    let phaseIndex = 0

    for (const window of input.windows) {
        let cursor = Math.max(window.startAt.getTime(), input.earliestStart.getTime())
        const windowEnd = window.endAt.getTime()

        while (cursor < windowEnd && phaseIndex < phases.length) {
            const phase = phases[phaseIndex]
            const available = (windowEnd - cursor) / MINUTE_MS
            const used = Math.min(available, phase.remaining)
            segments.push({
                kind: phase.kind,
                workday: window.workday,
                shiftCode: window.shiftCode,
                startAt: new Date(cursor),
                endAt: new Date(cursor + used * MINUTE_MS),
                minutes: used,
            })
            cursor += used * MINUTE_MS
            phase.remaining -= used
            if (phase.remaining <= 1e-9) phaseIndex += 1
        }
        if (phaseIndex >= phases.length) break
    }

    if (phaseIndex < phases.length || segments.length === 0) return null

    const production = segments.filter((segment) => segment.kind === "production")
    return {
        setupStartAt: segments[0].startAt,
        productionStartAt: (production[0] ?? segments[0]).startAt,
        endAt: segments[segments.length - 1].endAt,
        segments,
    }
}

export type PlannedLot = {
    /** 1, 2, 3… — lot numarası "kök-sıra" (ör. 1000-2). */
    sequence: number
    workday: string
    shiftCode: string
    startAt: Date
    endAt: Date
    shots: number
    /** Brüt adet (baskı × göz) — fire sonradan sayılır. */
    quantity: number
}

/**
 * Üretim parçalarını vardiya (vardiya günü + kod) başına bir lota toplar; baskıları süreyle
 * orantılı ve tam sayı olarak paylaştırır (yuvarlama farkı son lota).
 */
export function splitIntoShiftLots(input: { segments: ScheduleSegment[]; totalShots: number; cavities: number }): PlannedLot[] {
    const groups: Array<Omit<PlannedLot, "sequence" | "shots" | "quantity"> & { minutes: number }> = []
    for (const segment of input.segments) {
        if (segment.kind !== "production") continue
        const last = groups[groups.length - 1]
        if (last && last.workday === segment.workday && last.shiftCode === segment.shiftCode) {
            last.endAt = segment.endAt
            last.minutes += segment.minutes
        } else {
            groups.push({ workday: segment.workday, shiftCode: segment.shiftCode, startAt: segment.startAt, endAt: segment.endAt, minutes: segment.minutes })
        }
    }

    const totalMinutes = groups.reduce((sum, group) => sum + group.minutes, 0)
    let assigned = 0
    return groups.map((group, index) => {
        const isLast = index === groups.length - 1
        const shots = isLast
            ? input.totalShots - assigned
            : Math.floor((input.totalShots * group.minutes) / totalMinutes)
        assigned += shots
        return {
            sequence: index + 1,
            workday: group.workday,
            shiftCode: group.shiftCode,
            startAt: group.startAt,
            endAt: group.endAt,
            shots,
            quantity: shots * input.cavities,
        }
    })
}
