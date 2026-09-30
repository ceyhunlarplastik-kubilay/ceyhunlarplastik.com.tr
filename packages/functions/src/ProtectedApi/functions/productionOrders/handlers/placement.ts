import { randomUUID } from "node:crypto"
import createError from "http-errors"

import type { ActiveJobInterval, PlacementWrite, RippleJobDto } from "@/core/helpers/prisma/productionJobs/repository"
import { buildJobPlan, buildJobRescheduleWrite, formatLotNumber, type JobRescheduleWrite } from "@/core/helpers/production/jobPlan"
import { rippleEarliestStart, selectRippleFollowers } from "@/core/helpers/production/jobRipple"
import {
    DEFAULT_PLANNING_HORIZON_DAYS,
    evaluateOrderCandidates,
    planningHorizonRange,
    type OrderCandidate,
} from "@/core/helpers/production/orderCandidates"
import { addDaysToDateKey } from "@/core/helpers/production/productionCalendar"
import { formatProductionOrderNumber, OPEN_PRODUCTION_ORDER_STATUSES } from "@/core/helpers/production/productionOrders"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import type { IProductionOrderPlanningDependencies, ProductionPlacementMode } from "@/functions/ProtectedApi/types/productionOrders"

/**
 * Planlama yerleşimi — "Öner", "Planla", tahtada taşıma ve "sonrakileri kaydır" aynı yoldan
 * geçer: tanımlar BİR KEZ okunur (`loadPlanningContext`), motor her iş için bu bağlamla çalışır.
 * Plan hiçbir zaman istemciden alınmaz.
 */

export type PlanningOrder = NonNullable<Awaited<ReturnType<IProductionOrderPlanningDependencies["productionOrderRepository"]["getOrder"]>>>

export function assertPlannable(order: PlanningOrder) {
    const label = formatProductionOrderNumber(order.orderNumber)
    if (!OPEN_PRODUCTION_ORDER_STATUSES.includes(order.status)) {
        throw new createError.Conflict(`${label} kapanmış bir emir; planlanamaz.`)
    }
    if (!order.productVariant) {
        throw new createError.Conflict(`${label} için varyant katalogdan silinmiş; emir planlanamaz.`)
    }
    return order.productVariant
}

/** "Sonrakileri kaydır" zinciri ufku aşabilir: bağlam daha geniş okunur. */
export const RIPPLE_HORIZON_DAYS = DEFAULT_PLANNING_HORIZON_DAYS * 2

export async function loadPlanningContext(
    deps: IProductionOrderPlanningDependencies,
    now: Date,
    /** `calendarFrom`: takvim istisnaları / duruşlar bu andan itibaren okunur (tahmin geçmişte başlamış üretimi de kapsar). */
    options: { earliestStart?: Date; horizonDays?: number; calendarFrom?: Date } = {},
) {
    const startFrom = options.earliestStart && options.earliestStart > now ? options.earliestStart : now
    const range = planningHorizonRange(startFrom, options.horizonDays ?? DEFAULT_PLANNING_HORIZON_DAYS)
    const calendarFrom = options.calendarFrom && options.calendarFrom < startFrom ? options.calendarFrom : startFrom
    const calendarFromDate = calendarFrom < startFrom ? addDaysToDateKey(productionDateKey(calendarFrom), -1) : range.fromDate
    const [molds, machines, areas, patterns, exceptions, downtimes, materials, busy] = await Promise.all([
        deps.productionMoldRepository.listMolds(),
        deps.productionMachineRepository.listMachines(),
        deps.productionAreaRepository.listAreas(),
        deps.productionShiftPatternRepository.listShiftPatterns(),
        deps.productionCalendarExceptionRepository.listExceptions({ from: calendarFromDate, to: range.toDate }),
        deps.productionMachineDowntimeRepository.listDowntimes({ from: calendarFrom, to: range.horizonEnd }),
        deps.productionMaterialProfileRepository.listMaterialsWithProfiles(),
        deps.productionJobRepository.listActiveJobIntervals({ from: startFrom, to: range.horizonEnd }),
    ])
    return {
        now,
        molds,
        machines,
        patterns,
        exceptions,
        downtimes,
        materials,
        busy,
        areaShiftPatternIds: Object.fromEntries(areas.map((area) => [area.id, area.shiftPatternId])),
    }
}

export type PlanningContext = Awaited<ReturnType<typeof loadPlanningContext>>

type BusyInterval = Pick<ActiveJobInterval, "machineId" | "moldId" | "startAt" | "endAt">

export type CandidateScope = {
    earliestStart?: Date
    moldId?: string
    machineId?: string
    /** Bu işler meşgul sayılmaz (taşınan iş, kaydırılacak işler). */
    excludeJobIds?: Set<string>
    /** Henüz yazılmamış ama bu yerleşimde yer kaplayan aralıklar. */
    extraBusy?: BusyInterval[]
}

export function evaluateInContext(ctx: PlanningContext, order: PlanningOrder, scope: CandidateScope = {}) {
    const variant = assertPlannable(order)
    const machines = scope.machineId ? ctx.machines.filter((machine) => machine.id === scope.machineId) : ctx.machines

    // Birden çok hammaddeli versiyonda en yavaş (en büyük katsayı) belirler.
    const factors = ctx.materials
        .filter((material) => variant.version.materialIds.includes(material.id))
        .map((material) => material.profile?.cycleTimeFactor)
        .filter((factor): factor is number => typeof factor === "number")
    const productSizeId = variant.size.id
    const molds = ctx.molds.filter((mold) => (
        mold.status !== "RETIRED"
        && (!scope.moldId || mold.id === scope.moldId)
        && mold.outputs.some((output) => output.productSizeId === productSizeId)
    ))
    const busy: BusyInterval[] = [
        ...(scope.excludeJobIds ? ctx.busy.filter((job) => !scope.excludeJobIds?.has(job.id)) : ctx.busy),
        ...(scope.extraBusy ?? []),
    ]

    const result = evaluateOrderCandidates({
        order: { quantity: order.quantity, dueDate: order.dueDate, cycleTimeOverrideSec: order.cycleTimeOverrideSec, productSizeId },
        molds,
        machines,
        patterns: ctx.patterns,
        areaShiftPatternIds: ctx.areaShiftPatternIds,
        exceptions: ctx.exceptions,
        downtimes: ctx.downtimes,
        busy,
        materialFactor: factors.length > 0 ? Math.max(...factors) : null,
        now: ctx.now,
        earliestStart: scope.earliestStart,
    })
    return { ...result, variant, molds, machines }
}

type ScheduledCandidate = OrderCandidate & { setupStartAt: Date; productionStartAt: Date; endAt: Date }

/**
 * Emri tek makinede yerleştirir: kalıp verilmişse o, verilmemişse o makinede EN ERKEN biten
 * kalıp. Uygun değilse / ufukta bitmiyorsa 409 (gerekçeyle).
 */
export function placeOrderOnMachine(ctx: PlanningContext, order: PlanningOrder, input: {
    machineId: string
    moldId?: string
    label: string
    scope?: Omit<CandidateScope, "machineId" | "moldId">
}) {
    const evaluation = evaluateInContext(ctx, order, { ...input.scope, machineId: input.machineId, moldId: input.moldId })
    const machine = evaluation.machines[0]
    if (!machine) throw new createError.NotFound("Makine bulunamadı.")

    const onMachine = evaluation.candidates.filter((candidate) => candidate.machine.id === input.machineId)
    if (onMachine.length === 0) {
        const reasons = evaluation.excluded.filter((entry) => entry.machineCode === machine.code).flatMap((entry) => entry.reasons)
        throw new createError.Conflict(
            evaluation.molds.length === 0
                ? `${input.label} için kullanılabilir kalıp yok.`
                : `${input.label} ${machine.code} makinesinde üretilemez${reasons.length > 0 ? `: ${[...new Set(reasons)].join(" ")}` : "."}`,
        )
    }
    // Adaylar bitişe göre sıralı; ilk takvime yerleşen en erken biteni.
    const candidate = onMachine.find((entry) => entry.endAt && entry.setupStartAt && entry.productionStartAt) as ScheduledCandidate | undefined
    if (!candidate) {
        throw new createError.Conflict(`${input.label} ${machine.code} makinesinde ${DEFAULT_PLANNING_HORIZON_DAYS} gün içinde bitmiyor; başka zaman ya da makine seçin.`)
    }
    const mold = evaluation.molds.find((entry) => entry.id === candidate.mold.id)
    if (!mold) throw new createError.NotFound("Kalıp bulunamadı.")
    return { candidate, machine, mold, variant: evaluation.variant }
}

export function planFromPlacement(placement: ReturnType<typeof placeOrderOnMachine>, order: PlanningOrder, createdByUserId: string | null) {
    return buildJobPlan({
        candidate: placement.candidate,
        efficiencyPercent: placement.machine.plannedEfficiencyPercent,
        moldOutputs: placement.mold.outputs.map((output) => ({ id: output.id, productSizeId: output.productSizeId, cavities: output.cavities })),
        order: { id: order.id, productSizeId: placement.variant.size.id },
        versionSignature: placement.variant.version.signature,
        createdByUserId,
        newId: () => randomUUID(),
    })
}

export type ShiftedJob = { id: string; lotBaseNumber: number; fromStartAt: Date; toStartAt: Date }

/**
 * Taşıma yazımı + koruma: plan kısalınca kalkacak lotlarda not ya da lota özel ekip varsa 409 —
 * bu kayıtlar sessizce silinmesin (lotlar sıraya göre yerinde güncellenir, `jobPlan.ts`).
 */
export function rescheduleWriteOrConflict(
    plan: ReturnType<typeof planFromPlacement>,
    job: { id: string; lotBaseNumber: number; outputs: Array<{ id: string; moldOutputId: string }>; lots: RippleJobDto["lots"] },
): JobRescheduleWrite {
    const write = buildJobRescheduleWrite(plan, { jobId: job.id, outputs: job.outputs, lots: job.lots })
    if (write.blockedLotSequences.length > 0) {
        const lots = write.blockedLotSequences.map((sequence) => formatLotNumber(job.lotBaseNumber, sequence)).join(", ")
        throw new createError.Conflict(
            `${job.lotBaseNumber} numaralı iş bu yerleşimde daha az lota iner ve ${lots} kalkar; bu lotlarda not ya da lota özel ekip var. `
            + "Notları silin / ekibi vardiya ekibine döndürün ya da başka bir zaman seçin.",
        )
    }
    return write
}

/**
 * "Sonrakileri kaydır": yerleşen işin arkasına, makinede bırakılan andan sonra başlayan planlı
 * işleri sırayla yeniden planlar (kural `core/helpers/production/jobRipple.ts`). Yerinde kalan
 * iş yazılmaz. Hiçbir şey yazmaz; yazımlar çağıranın tek transaction'ına eklenir.
 */
export async function planRippleFollowers(
    deps: IProductionOrderPlanningDependencies,
    ctx: PlanningContext,
    input: {
        machineId: string
        followers: RippleJobDto[]
        placed: BusyInterval
        excludeJobIds: Set<string>
    },
): Promise<{ reschedules: PlacementWrite["reschedules"]; shifted: ShiftedJob[] }> {
    const reschedules: PlacementWrite["reschedules"] = []
    const shifted: ShiftedJob[] = []
    const placedBusy: BusyInterval[] = [input.placed]
    let previousEnd = input.placed.endAt

    for (const follower of input.followers) {
        const label = `${follower.lotBaseNumber} numaralı iş`
        if (follower.orderIds.length !== 1) throw new createError.Conflict(`${label} tek bir emre bağlı değil; kaydırılamaz.`)
        const order = await deps.productionOrderRepository.getOrder(follower.orderIds[0])
        if (!order) throw new createError.Conflict(`${label} için emir bulunamadı; kaydırılamaz.`)

        const placement = placeOrderOnMachine(ctx, order, {
            machineId: input.machineId,
            moldId: follower.moldId,
            label,
            scope: {
                earliestStart: rippleEarliestStart(follower.setupStartAt, previousEnd),
                excludeJobIds: input.excludeJobIds,
                extraBusy: placedBusy,
            },
        })
        const { candidate } = placement
        placedBusy.push({ machineId: input.machineId, moldId: follower.moldId, startAt: candidate.setupStartAt, endAt: candidate.endAt })
        previousEnd = candidate.endAt

        const unchanged = candidate.setupStartAt.getTime() === follower.setupStartAt.getTime()
            && candidate.endAt.getTime() === follower.plannedEndAt.getTime()
        if (unchanged) continue

        const plan = planFromPlacement(placement, order, null)
        reschedules.push({ id: follower.id, expectedVersion: follower.version, write: rescheduleWriteOrConflict(plan, follower) })
        shifted.push({ id: follower.id, lotBaseNumber: follower.lotBaseNumber, fromStartAt: follower.setupStartAt, toStartAt: candidate.setupStartAt })
    }
    return { reschedules, shifted }
}

/** Kip ve istenen an → bağlam seçenekleri + kaydırılacak işler. */
export async function prepareRipple(
    deps: IProductionOrderPlanningDependencies,
    input: { mode: ProductionPlacementMode; machineId: string; requestedStart: Date; now: Date; excludeJobId?: string },
) {
    if (input.mode !== "push-later") return { followers: [] as RippleJobDto[], horizonDays: DEFAULT_PLANNING_HORIZON_DAYS }
    const from = input.requestedStart > input.now ? input.requestedStart : input.now
    const candidates = await deps.productionJobRepository.listPlannedJobsOnMachine(input.machineId, from)
    return {
        followers: selectRippleFollowers(candidates, { machineId: input.machineId, from, excludeJobId: input.excludeJobId }),
        horizonDays: RIPPLE_HORIZON_DAYS,
    }
}
