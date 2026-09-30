import createError from "http-errors"

import type { ProductionOrderWriteInput } from "@/core/helpers/prisma/productionOrders/repository"
import type { PlacementWrite } from "@/core/helpers/prisma/productionJobs/repository"
import { dueEndAtFor, forecastJob, forecastStartPoint, machineWindowsFrom } from "@/core/helpers/production/jobForecast"
import { selectRippleFollowers } from "@/core/helpers/production/jobRipple"
import { DEFAULT_PLANNING_HORIZON_DAYS } from "@/core/helpers/production/orderCandidates"
import {
    canSetProductionOrderStatusManually,
    findProductionOrderIssues,
    formatProductionOrderNumber,
    isProductionOrderContentEditable,
    isProductionOrderDeletable,
    OPEN_PRODUCTION_ORDER_STATUSES,
} from "@/core/helpers/production/productionOrders"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, withoutUndefined } from "@/functions/shared/production/input"
import {
    evaluateInContext,
    loadPlanningContext,
    placeOrderOnMachine,
    planFromPlacement,
    planRippleFollowers,
    prepareRipple,
    rescheduleWriteOrConflict,
    RIPPLE_HORIZON_DAYS,
} from "./placement"
import type {
    ICreateProductionOrderEvent,
    IDeleteProductionJobEvent,
    IDeleteProductionOrderEvent,
    IGetProductionOrderCandidatesEvent,
    IListProductionOrdersEvent,
    IPlanProductionOrderEvent,
    IProductionOrderPlanningDependencies,
    IPushJobFollowersEvent,
    IRescheduleProductionJobEvent,
    IProductionOrderDependencies,
    IUpdateProductionOrderEvent,
} from "@/functions/ProtectedApi/types/productionOrders"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function assertRules(input: Parameters<typeof findProductionOrderIssues>[0]) {
    const issues = findProductionOrderIssues(input)
    if (issues.length > 0) throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))
}

/** Varyant var mı ve ölçüsünün kullanılabilir bir kalıbı var mı — emir yalnız kalıbı olan ölçüye açılır. */
async function resolveMoldableVariant(deps: IProductionOrderDependencies, variantId: string) {
    const variant = await deps.productionReferenceRepository.getVariantForOrder(variantId)
    if (!variant) throw new createError.NotFound("Varyant bulunamadı.")
    if (variant.usableMoldCount === 0) {
        throw new createError.BadRequest(
            `${variant.fullCode} ölçüsünün kullanılabilir kalıbı yok (tedarikçiden alınan ürün ya da kalıbı kullanım dışı); üretim emri açılamaz.`,
        )
    }
    return variant
}

async function assertCustomer(deps: IProductionOrderDependencies, customerId: string | null | undefined) {
    if (customerId && !(await deps.productionReferenceRepository.customerExists(customerId))) {
        throw new createError.NotFound("Müşteri bulunamadı.")
    }
}

export const listProductionOrdersHandler = ({ productionOrderRepository }: IProductionOrderDependencies) => {
    return async (event: IListProductionOrdersEvent) => {
        const query = event.queryStringParameters ?? {}
        const page = Math.max(1, Number(query.page ?? 1))
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.limit ?? DEFAULT_PAGE_SIZE)))
        const status = query.status ?? "open"

        const result = await productionOrderRepository.listOrders({
            page,
            limit,
            search: query.q,
            statuses: status === "all" ? undefined : status === "open" ? OPEN_PRODUCTION_ORDER_STATUSES : [status],
        })
        return apiResponseDTO({ statusCode: 200, payload: result })
    }
}

export const createProductionOrderHandler = (deps: IProductionOrderDependencies) => {
    return async (event: ICreateProductionOrderEvent) => {
        const body = event.body
        // Varsayılanlar şemada değil burada (ajv union altındaki default'u uygulayamıyor).
        const source = body.source ?? "MANUAL"
        assertRules({
            quantity: body.quantity,
            dueDate: body.dueDate,
            source,
            customerId: body.customerId,
            cycleTimeOverrideSec: body.cycleTimeOverrideSec,
        })

        const variant = await resolveMoldableVariant(deps, body.productVariantId)
        await assertCustomer(deps, body.customerId)

        const order = await deps.productionOrderRepository.createOrder({
            productVariantId: variant.id,
            variantCode: variant.fullCode,
            quantity: body.quantity,
            dueDate: body.dueDate ?? null,
            priority: body.priority ?? "NORMAL",
            source,
            customerId: body.customerId ?? null,
            cycleTimeOverrideSec: body.cycleTimeOverrideSec ?? null,
            status: "DRAFT",
            notes: optionalText(body.notes) ?? null,
            createdByUserId: event.user?.id ?? null,
        })
        return apiResponseDTO({ statusCode: 201, payload: { order } })
    }
}

export const updateProductionOrderHandler = (deps: IProductionOrderDependencies) => {
    return async (event: IUpdateProductionOrderEvent) => {
        const { id } = event.pathParameters
        const existing = await deps.productionOrderRepository.getOrder(id)
        if (!existing) throw new createError.NotFound("Üretim emri bulunamadı.")

        const { status, notes, ...content } = event.body
        const label = formatProductionOrderNumber(existing.orderNumber)

        if (status !== undefined && status !== existing.status && !canSetProductionOrderStatusManually(existing.status, status)) {
            throw new createError.Conflict(
                `${label} bu duruma elle alınamaz; elle yalnız Taslak, Beklemede ve İptal arasında geçilir.`,
            )
        }

        const contentFields = Object.values(content).some((value) => value !== undefined)
        const effectiveStatus = status ?? existing.status
        if (contentFields && !isProductionOrderContentEditable(effectiveStatus)) {
            throw new createError.Conflict(`${label} düzenlenemez; yalnız Taslak ya da Beklemedeki emrin içeriği değişir.`)
        }

        // Kısmi güncelleme: kurallar gönderilen değer ile kayıttaki değerin BİRLEŞİMİNE uygulanır.
        const merged = {
            quantity: content.quantity ?? existing.quantity,
            dueDate: content.dueDate === undefined ? existing.dueDate : content.dueDate,
            source: content.source ?? existing.source,
            customerId: content.customerId === undefined ? existing.customerId : content.customerId,
            cycleTimeOverrideSec: content.cycleTimeOverrideSec === undefined
                ? existing.cycleTimeOverrideSec
                : content.cycleTimeOverrideSec,
        }
        assertRules(merged)

        const variant = content.productVariantId && content.productVariantId !== existing.productVariantId
            ? await resolveMoldableVariant(deps, content.productVariantId)
            : null
        if (content.customerId && content.customerId !== existing.customerId) await assertCustomer(deps, content.customerId)

        const input = withoutUndefined({
            productVariantId: variant?.id,
            variantCode: variant?.fullCode,
            quantity: content.quantity,
            dueDate: content.dueDate,
            priority: content.priority,
            source: content.source,
            customerId: content.customerId,
            cycleTimeOverrideSec: content.cycleTimeOverrideSec,
            status,
            notes: optionalText(notes),
        }) as Partial<ProductionOrderWriteInput>

        const order = await deps.productionOrderRepository.updateOrder(id, input)
        return apiResponseDTO({ statusCode: 200, payload: { order } })
    }
}

export const deleteProductionOrderHandler = ({ productionOrderRepository }: IProductionOrderDependencies) => {
    return async (event: IDeleteProductionOrderEvent) => {
        const { id } = event.pathParameters
        const existing = await productionOrderRepository.getOrder(id)
        if (!existing) throw new createError.NotFound("Üretim emri bulunamadı.")

        if (!isProductionOrderDeletable(existing.status)) {
            throw new createError.Conflict(
                `${formatProductionOrderNumber(existing.orderNumber)} silinemez; yalnız taslak emir silinir — gerekirse iptal edin.`,
            )
        }

        await productionOrderRepository.deleteOrder(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}

/** "Öner" — plan ÖNİZLEMESİ (hiçbir şey yazılmaz). */
export const getProductionOrderCandidatesHandler = (deps: IProductionOrderPlanningDependencies) => {
    return async (event: IGetProductionOrderCandidatesEvent) => {
        const order = await deps.productionOrderRepository.getOrder(event.pathParameters.id)
        if (!order) throw new createError.NotFound("Üretim emri bulunamadı.")

        const now = new Date()
        const ctx = await loadPlanningContext(deps, now)
        const { candidates, excluded } = evaluateInContext(ctx, order)

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                order: { id: order.id, orderNumber: order.orderNumber, quantity: order.quantity, dueDate: order.dueDate, variantCode: order.variantCode },
                generatedAt: now,
                horizonDays: DEFAULT_PLANNING_HORIZON_DAYS,
                candidates,
                excluded,
            },
        })
    }
}

/** İstenen an vardiya dışı / dolu ise iş kayar; bu kadarlık fark "kaydı" sayılmaz. */
const SHIFT_TOLERANCE_MS = 60_000

function wasShifted(actualStart: Date, requestedStart: Date | null, now: Date): boolean {
    if (!requestedStart) return false
    const effective = requestedStart > now ? requestedStart : now
    return actualStart.getTime() - effective.getTime() > SHIFT_TOLERANCE_MS
}

async function commitOrConflict(deps: IProductionOrderPlanningDependencies, write: PlacementWrite, label: string) {
    const result = await deps.productionJobRepository.commitPlacement(write)
    if (!result) throw new createError.Conflict(`${label} ya da kaydırılan işler bu arada değiştirilmiş; tahtayı yenileyip tekrar deneyin.`)
    return result
}

/**
 * "Planla" — emri bir makinede işe çevirir. Kalıp verilmezse o makinede en erken biten kalıp
 * seçilir (tahtaya emir sürükleme); `startAt` en erken başlangıçtır. Plan istemciden ALINMAZ:
 * sunucu aynı motorla, o anki takvim / duruş / mevcut işlerle yeniden hesaplar. `push-later`
 * kipinde makinede o andan sonra başlayan planlı işler arkasına kaydırılır (tek transaction).
 */
export const planProductionOrderHandler = (deps: IProductionOrderPlanningDependencies) => {
    return async (event: IPlanProductionOrderEvent) => {
        const order = await deps.productionOrderRepository.getOrder(event.pathParameters.id)
        if (!order) throw new createError.NotFound("Üretim emri bulunamadı.")
        const label = formatProductionOrderNumber(order.orderNumber)

        if (order.status !== "DRAFT" && order.status !== "ON_HOLD") {
            throw new createError.Conflict(`${label} zaten planlanmış ya da kapanmış; önce mevcut işi iptal edin.`)
        }

        const { machineId, moldId, startAt, placement: mode = "first-gap" } = event.body
        const now = new Date()
        const requestedStart = startAt ? new Date(startAt) : null
        const ripple = await prepareRipple(deps, { mode, machineId, requestedStart: requestedStart ?? now, now })
        const ctx = await loadPlanningContext(deps, now, { earliestStart: requestedStart ?? undefined, horizonDays: ripple.horizonDays })
        const excludeJobIds = new Set(ripple.followers.map((job) => job.id))

        const placement = placeOrderOnMachine(ctx, order, {
            machineId,
            moldId,
            label,
            scope: { earliestStart: requestedStart ?? undefined, excludeJobIds },
        })
        const plan = planFromPlacement(placement, order, event.user?.id ?? null)
        const { reschedules, shifted } = await planRippleFollowers(deps, ctx, {
            machineId,
            followers: ripple.followers,
            placed: { machineId, moldId: placement.mold.id, startAt: placement.candidate.setupStartAt, endAt: placement.candidate.endAt },
            excludeJobIds,
        })
        await commitOrConflict(deps, { create: { plan, orderId: order.id }, reschedules }, label)

        const updated = await deps.productionOrderRepository.getOrder(order.id)
        return apiResponseDTO({
            statusCode: 201,
            payload: {
                order: updated,
                shifted: wasShifted(placement.candidate.setupStartAt, requestedStart, now),
                shiftedJobs: shifted,
            },
        })
    }
}

/** Planlı (sahaya verilmemiş) işi iptal eder; emir başka işi yoksa Taslağa döner. */
export const deleteProductionJobHandler = (deps: IProductionOrderPlanningDependencies) => {
    return async (event: IDeleteProductionJobEvent) => {
        const job = await deps.productionJobRepository.getJob(event.pathParameters.id)
        if (!job) throw new createError.NotFound("Üretim işi bulunamadı.")
        if (job.status !== "PLANNED") {
            throw new createError.Conflict(`${job.lotBaseNumber} numaralı iş sahaya verilmiş; planlı olmayan iş silinemez.`)
        }

        await deps.productionJobRepository.deleteJob(job.id, job.orderIds)
        return apiResponseDTO({ statusCode: 200, payload: { id: job.id } })
    }
}

/**
 * Tahtada taşıma: aynı kalıp, seçilen makine, istenen andan sonraki ilk uygun boşluk (ya da
 * `push-later` ile tam o an + sonrakileri kaydır). Plan sunucuda yeniden hesaplanır; iş kendi
 * aralığını meşgul saymaz. `expectedVersion` tutmazsa (başkası taşımış) 409.
 */
export const rescheduleProductionJobHandler = (deps: IProductionOrderPlanningDependencies) => {
    return async (event: IRescheduleProductionJobEvent) => {
        const job = await deps.productionJobRepository.getJob(event.pathParameters.id)
        if (!job) throw new createError.NotFound("Üretim işi bulunamadı.")
        const label = `${job.lotBaseNumber} numaralı iş`
        const { machineId, startAt, expectedVersion, placement: mode = "first-gap" } = event.body

        if (job.status !== "PLANNED") {
            throw new createError.Conflict(`${label} sahaya verilmiş; yalnız planlı iş taşınabilir.`)
        }
        if (job.version !== expectedVersion) {
            throw new createError.Conflict(`${label} bu arada değiştirilmiş; tahtayı yenileyip tekrar deneyin.`)
        }
        if (job.orderIds.length !== 1) {
            throw new createError.Conflict(`${label} tek bir emre bağlı değil; taşınamaz.`)
        }
        const order = await deps.productionOrderRepository.getOrder(job.orderIds[0])
        if (!order) throw new createError.Conflict(`${label} için emir bulunamadı; taşınamaz.`)

        const requestedStart = new Date(startAt)
        const now = new Date()
        const ripple = await prepareRipple(deps, { mode, machineId, requestedStart, now, excludeJobId: job.id })
        const ctx = await loadPlanningContext(deps, now, { earliestStart: requestedStart, horizonDays: ripple.horizonDays })
        const excludeJobIds = new Set([job.id, ...ripple.followers.map((follower) => follower.id)])

        const placement = placeOrderOnMachine(ctx, order, {
            machineId,
            moldId: job.moldId,
            label: `Kalıp (${label})`,
            scope: { earliestStart: requestedStart, excludeJobIds },
        })
        const plan = planFromPlacement(placement, order, null)
        const { reschedules, shifted } = await planRippleFollowers(deps, ctx, {
            machineId,
            followers: ripple.followers,
            placed: { machineId, moldId: job.moldId, startAt: placement.candidate.setupStartAt, endAt: placement.candidate.endAt },
            excludeJobIds,
        })
        const write = rescheduleWriteOrConflict(plan, job)
        const result = await commitOrConflict(deps, { reschedules: [{ id: job.id, expectedVersion, write }, ...reschedules] }, label)

        const { candidate } = placement
        return apiResponseDTO({
            statusCode: 200,
            payload: {
                job: {
                    id: job.id,
                    version: result.versions[job.id],
                    machineId,
                    setupStartAt: candidate.setupStartAt,
                    productionStartAt: candidate.productionStartAt,
                    plannedEndAt: candidate.endAt,
                    lotCount: write.lotUpdates.length + write.lotCreates.length,
                },
                requestedStartAt: requestedStart,
                shifted: wasShifted(candidate.setupStartAt, requestedStart, now),
                shiftedJobs: shifted,
            },
        })
    }
}

/**
 * Gecikme önerisi (4.3): sahaya verilmiş / üretimdeki iş plandan geç bitecekse, aynı makinede
 * ondan sonra planlanan PLANLI işler tahmini bitişin arkasına sırayla kaydırılır (3.3 zinciri:
 * boşluk korunur, değmeyen iş yerinde kalır). Tahmin istemciden ALINMAZ — sunucu aynı çekirdek
 * fonksiyonla yeniden hesaplar. Yazım tek dizi transaction'ı; kaydırılan her işin sürümü filtreli.
 */
export const pushJobFollowersHandler = (deps: IProductionOrderPlanningDependencies) => {
    return async (event: IPushJobFollowersEvent) => {
        const job = await deps.productionJobRepository.getJobForForecast(event.pathParameters.id)
        if (!job) throw new createError.NotFound("Üretim işi bulunamadı.")
        const label = `${job.lotBaseNumber} numaralı iş`
        if (job.status === "PLANNED") {
            throw new createError.Conflict(`${label} henüz planlı; tahtada kendisini taşıyın. Bu öneri sahaya verilmiş işler içindir.`)
        }
        if (job.status === "COMPLETED" || job.status === "CANCELLED") throw new createError.Conflict(`${label} kapanmış.`)

        const now = new Date()
        const start = forecastStartPoint(job, job.lots, now)
        const ctx = await loadPlanningContext(deps, now, { earliestStart: start.startAt, horizonDays: RIPPLE_HORIZON_DAYS, calendarFrom: start.startAt })
        const machine = ctx.machines.find((entry) => entry.id === job.machineId)
        if (!machine) throw new createError.NotFound("Makine bulunamadı.")

        const forecast = forecastJob({
            job,
            lots: job.lots,
            now,
            dueEndAt: dueEndAtFor(job.dueDates),
            windowsFrom: machineWindowsFrom({
                machine,
                areaShiftPatternIds: ctx.areaShiftPatternIds,
                patterns: ctx.patterns,
                exceptions: ctx.exceptions,
                downtimes: ctx.downtimes.filter((downtime) => downtime.machineId === machine.id),
            }),
        })
        if (!forecast.projectedEndAt) throw new createError.Conflict(`${label} için tahmini bitiş hesaplanamadı (makinenin takviminde yer yok).`)
        if (forecast.projectedEndAt <= job.plannedEndAt) throw new createError.Conflict(`${label} planına göre gidiyor; kaydırılacak iş yok.`)

        const candidates = await deps.productionJobRepository.listPlannedJobsOnMachine(job.machineId, job.setupStartAt)
        const followers = selectRippleFollowers(candidates, { machineId: job.machineId, from: job.setupStartAt, excludeJobId: job.id })
        if (followers.length === 0) throw new createError.Conflict(`${machine.code} makinesinde ${job.lotBaseNumber} numaralı işten sonra planlanmış iş yok.`)

        const excludeJobIds = new Set(followers.map((follower) => follower.id))
        const { reschedules, shifted } = await planRippleFollowers(deps, ctx, {
            machineId: job.machineId,
            followers,
            placed: { machineId: job.machineId, moldId: job.moldId, startAt: job.setupStartAt, endAt: forecast.projectedEndAt },
            excludeJobIds,
        })
        if (reschedules.length > 0) await commitOrConflict(deps, { reschedules }, label)

        return apiResponseDTO({
            statusCode: 200,
            payload: { projectedEndAt: forecast.projectedEndAt, delayMinutes: forecast.delayMinutes ?? 0, shiftedJobs: shifted },
        })
    }
}
