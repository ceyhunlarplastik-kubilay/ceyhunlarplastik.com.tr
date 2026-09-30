/**
 * Üretim emri için ADAY planlar ("Öner") — SAF modül. Emrin ölçüsünü basan her kalıp ×
 * makine çifti için: uygunluk (tek kaynak `moldMachineCompatibility`), çevrim zinciri, baskı,
 * süre, vardiya takvimine yayılmış başlangıç/bitiş, termine yetişme, makine maliyeti ve
 * vardiya lotları. Uygun olmayan (✗) çiftler aday olmaz, gerekçesiyle ayrıca döner.
 *
 * Mevcut işler (`busy`) duruş gibi pencereden düşülür: makinenin kendi işleri ve aynı kalıbı
 * başka makinede kullanan işler. Yeni iş mevcut işlerin ARASINA/SONRASINA yerleşir; mevcut işler
 * kaydırılmaz ("sonrakileri kaydır" Faz 3).
 */
import { addDaysToDateKey } from "./productionCalendar"
import { productionDateKey, PRODUCTION_TIME_ZONE, wallTimeToUtc } from "./productionTime"
import {
    computeProductionMinutes,
    computeShotCount,
    resolveCycleTimeSec,
    scheduleForward,
    splitIntoShiftLots,
    type CycleTimeSource,
    type PlannedLot,
} from "./jobScheduling"
import {
    evaluateMoldMachineCompatibility,
    type CompatibilityLevel,
    type CompatibilityMachineInput,
    type CompatibilityMoldInput,
} from "./moldMachineCompatibility"
import { buildWorkingWindows, type CalendarExceptionForDay } from "./shiftCalendar"
import { resolveEffectiveShiftPattern, type ShiftDefinitionInput } from "./shiftPatterns"

export const DEFAULT_PLANNING_HORIZON_DAYS = 45

export type CandidateMold = Omit<CompatibilityMoldInput, "outputs" | "machineProfiles"> & {
    id: string
    code: string
    name: string
    standardCycleTimeSec: number
    expectedScrapPercent: number
    setupMinutes: number
    outputs: Array<{ productSizeId: string; cavities: number; partWeightG: number | null }>
    machineProfiles: Array<{
        machineId: string
        isPreferred: boolean
        isBlocked: boolean
        cycleTimeSec: number | null
        setupMinutes: number | null
    }>
}

export type CandidateMachine = CompatibilityMachineInput & {
    code: string
    name: string
    areaId: string
    plannedEfficiencyPercent: number
    hourlyCost: number | null
    currency: string
    shiftPatternId: string | null
}

export type CandidateShiftPattern = {
    id: string
    isDefault: boolean
    timezone: string
    shifts: Array<ShiftDefinitionInput & { sortOrder: number }>
}

export type OrderCandidate = {
    machine: { id: string; code: string; name: string }
    mold: { id: string; code: string; name: string }
    cavities: number
    verdict: Exclude<CompatibilityLevel, "error">
    /** Dikkat ya da eksik bilgi içeren kontrollerin mesajları. */
    notes: string[]
    isPreferred: boolean
    cycleTimeSec: number
    cycleSource: CycleTimeSource
    shots: number
    setupMinutes: number
    productionMinutes: number
    setupStartAt: Date | null
    productionStartAt: Date | null
    endAt: Date | null
    /** Termin yoksa `null`; plan ufukta bitmiyorsa `false`. */
    meetsDueDate: boolean | null
    machineCost: number | null
    currency: string
    lots: PlannedLot[]
    /** En erken biten aday. */
    isEarliest: boolean
    /** Termine yetişenler (termin yoksa hepsi) arasında makine maliyeti en düşük. */
    isCheapest: boolean
    /** Vardiya düzeni bulunamadı — makine hiç çalışmıyor sayılır. */
    missingShiftPattern: boolean
}

export type ExcludedCandidate = { machineCode: string; moldCode: string; reasons: string[] }

export function evaluateOrderCandidates(input: {
    order: {
        quantity: number
        dueDate: string | null
        cycleTimeOverrideSec: number | null
        productSizeId: string
        /** Varyanta özel çevrim (`ProductionVariantProfile`); yoksa `null`. */
        variantCycleTimeSec?: number | null
    }
    molds: CandidateMold[]
    machines: CandidateMachine[]
    patterns: CandidateShiftPattern[]
    areaShiftPatternIds: Record<string, string | null>
    exceptions: CalendarExceptionForDay[]
    downtimes: Array<{ machineId: string; startAt: Date; endAt: Date }>
    /** Kapanmamış işlerin kapladığı aralıklar (bağlama başı → planlı bitiş). */
    busy?: Array<{ machineId: string; moldId: string; startAt: Date; endAt: Date }>
    materialFactor: number | null
    now: Date
    /**
     * Planın başlayabileceği en erken an (tahtada taşıma: bırakılan yer). Geçmişteyse `now`
     * kullanılır; ufuk bu andan itibaren sayılır.
     */
    earliestStart?: Date
    horizonDays?: number
}): { candidates: OrderCandidate[]; excluded: ExcludedCandidate[] } {
    const startFrom = input.earliestStart && input.earliestStart > input.now ? input.earliestStart : input.now
    const horizonEnd = new Date(startFrom.getTime() + (input.horizonDays ?? DEFAULT_PLANNING_HORIZON_DAYS) * 86_400_000)
    const patternById = new Map(input.patterns.map((pattern) => [pattern.id, pattern]))
    const defaultPatternId = input.patterns.find((pattern) => pattern.isDefault)?.id ?? null
    const dueEnd = input.order.dueDate
        ? wallTimeToUtc(`${addDaysToDateKey(input.order.dueDate, 1)}T00:00`, PRODUCTION_TIME_ZONE)
        : null

    const candidates: OrderCandidate[] = []
    const excluded: ExcludedCandidate[] = []

    for (const mold of input.molds) {
        const output = mold.outputs.find((entry) => entry.productSizeId === input.order.productSizeId)
        if (!output || output.cavities < 1) continue

        for (const machine of input.machines) {
            const compatibility = evaluateMoldMachineCompatibility(mold, machine)
            if (compatibility.verdict === "error") {
                excluded.push({
                    machineCode: machine.code,
                    moldCode: mold.code,
                    reasons: compatibility.checks.filter((check) => check.level === "error").map((check) => check.message),
                })
                continue
            }

            const profile = mold.machineProfiles.find((entry) => entry.machineId === machine.id)
            const cycle = resolveCycleTimeSec({
                orderOverrideSec: input.order.cycleTimeOverrideSec,
                machineCardSec: profile?.cycleTimeSec,
                variantSec: input.order.variantCycleTimeSec,
                moldStandardSec: mold.standardCycleTimeSec,
                materialFactor: input.materialFactor,
            })
            const shots = computeShotCount({ quantity: input.order.quantity, cavities: output.cavities, scrapPercent: mold.expectedScrapPercent })
            const productionMinutes = computeProductionMinutes({ shots, cycleTimeSec: cycle.cycleTimeSec, efficiencyPercent: machine.plannedEfficiencyPercent })
            const setupMinutes = profile?.setupMinutes ?? mold.setupMinutes

            const effective = resolveEffectiveShiftPattern({
                machineShiftPatternId: machine.shiftPatternId,
                areaShiftPatternId: input.areaShiftPatternIds[machine.areaId] ?? null,
                defaultShiftPatternId: defaultPatternId,
            })
            const pattern = effective.patternId ? patternById.get(effective.patternId) : undefined
            const windows = pattern
                ? buildWorkingWindows({
                    shifts: pattern.shifts,
                    from: startFrom,
                    to: horizonEnd,
                    exceptions: input.exceptions,
                    downtimes: [
                        ...input.downtimes.filter((downtime) => downtime.machineId === machine.id),
                        ...(input.busy ?? []).filter((job) => job.machineId === machine.id || job.moldId === mold.id),
                    ],
                    machineId: machine.id,
                    areaId: machine.areaId,
                    timeZone: pattern.timezone,
                })
                : []
            const schedule = scheduleForward({ windows, earliestStart: startFrom, setupMinutes, productionMinutes })

            candidates.push({
                machine: { id: machine.id, code: machine.code, name: machine.name },
                mold: { id: mold.id, code: mold.code, name: mold.name },
                cavities: output.cavities,
                verdict: compatibility.verdict,
                notes: compatibility.checks.filter((check) => check.level !== "ok").map((check) => `${check.label}: ${check.message}`),
                isPreferred: compatibility.isPreferred,
                cycleTimeSec: cycle.cycleTimeSec,
                cycleSource: cycle.source,
                shots,
                setupMinutes,
                productionMinutes,
                setupStartAt: schedule?.setupStartAt ?? null,
                productionStartAt: schedule?.productionStartAt ?? null,
                endAt: schedule?.endAt ?? null,
                meetsDueDate: dueEnd ? Boolean(schedule && schedule.endAt <= dueEnd) : null,
                machineCost: machine.hourlyCost == null
                    ? null
                    : Math.round(((setupMinutes + productionMinutes) / 60) * machine.hourlyCost * 100) / 100,
                currency: machine.currency,
                lots: schedule ? splitIntoShiftLots({ segments: schedule.segments, totalShots: shots, cavities: output.cavities }) : [],
                isEarliest: false,
                isCheapest: false,
                missingShiftPattern: !pattern,
            })
        }
    }

    candidates.sort((a, b) => {
        if (a.endAt && b.endAt) return a.endAt.getTime() - b.endAt.getTime()
        if (a.endAt) return -1
        if (b.endAt) return 1
        return a.machine.code.localeCompare(b.machine.code)
    })

    const scheduled = candidates.filter((candidate) => candidate.endAt)
    if (scheduled[0]) scheduled[0].isEarliest = true
    const costPool = scheduled.filter((candidate) => candidate.machineCost != null && candidate.meetsDueDate !== false)
    const cheapest = costPool.reduce<OrderCandidate | null>(
        (best, candidate) => (!best || (candidate.machineCost as number) < (best.machineCost as number) ? candidate : best),
        null,
    )
    if (cheapest) cheapest.isCheapest = true

    return { candidates, excluded }
}

/** Fabrika takviminde bugün + ufuk — takvim/duruş sorgularının tarih aralığı. */
export function planningHorizonRange(now: Date, horizonDays = DEFAULT_PLANNING_HORIZON_DAYS) {
    const from = addDaysToDateKey(productionDateKey(now), -1)
    const to = addDaysToDateKey(productionDateKey(now), horizonDays + 1)
    return { fromDate: from, toDate: to, horizonEnd: new Date(now.getTime() + horizonDays * 86_400_000) }
}
