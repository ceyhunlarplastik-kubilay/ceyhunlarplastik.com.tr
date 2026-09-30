import createError from "http-errors"

import {
    canTransitionJob,
    deriveOrderStatusFromJobs,
    findJobCompletionIssues,
    JOB_STATUS_LABELS,
} from "@/core/helpers/production/jobStateMachine"
import { unreportedJobShots } from "@/core/helpers/production/lotReports"
import { buildLotOperatorSnapshot } from "@/core/helpers/production/productionLots"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IGetProductionKanbanEvent,
    IProductionJobDependencies,
    ITransitionProductionJobEvent,
} from "@/functions/ProtectedApi/types/productionJobs"

type JobForSnapshot = NonNullable<Awaited<ReturnType<IProductionJobDependencies["productionJobRepository"]["getJob"]>>>

async function snapshotLotOperators(deps: IProductionJobDependencies, job: JobForSnapshot) {
    const lots = job.lots.filter((lot) => lot.lotOperatorCount === 0)
    if (lots.length === 0) return []
    const assignments = await deps.productionShiftAssignmentRepository.listForCells(
        lots.map((lot) => ({ machineId: job.machineId, shiftDate: lot.shiftDate, shiftCode: lot.shiftCode })),
    )
    return buildLotOperatorSnapshot({
        lots,
        assignments: assignments.map((assignment) => ({ shiftDate: assignment.shiftDate, shiftCode: assignment.shiftCode, operatorId: assignment.operator.id })),
    })
}

/** Panonun "Tamamlandı" sütunu bu kadar günü gösterir. */
export const KANBAN_COMPLETED_WINDOW_DAYS = 7

export const getProductionKanbanHandler = (deps: IProductionJobDependencies) => {
    return async (_event: IGetProductionKanbanEvent) => {
        const now = new Date()
        const completedSince = new Date(now.getTime() - KANBAN_COMPLETED_WINDOW_DAYS * 86_400_000)
        const jobs = await deps.productionJobRepository.listKanbanJobs({ completedSince })
        return apiResponseDTO({
            statusCode: 200,
            payload: { generatedAt: now, completedWindowDays: KANBAN_COMPLETED_WINDOW_DAYS, jobs },
        })
    }
}

/**
 * Pano geçişi (sürükleme ya da "Durumu değiştir"). Kural core `jobStateMachine.ts`: izinsiz
 * geçiş 409, tamamlamada eksik / bozuk adet 400. Emrin durumu işlerinden türetilip AYNI dizi
 * transaction'ında yazılır; iş sürümü tutmazsa (başkası değiştirmiş) hiçbir şey yazılmaz → 409.
 * Tamamlamada lota özel ekibi olmayan lotların ekibi vardiya ekibinden dondurulur (istatistik
 * sonradan yapılan ekip değişikliğinden etkilenmesin).
 */
export const transitionProductionJobHandler = (deps: IProductionJobDependencies) => {
    return async (event: ITransitionProductionJobEvent) => {
        const job = await deps.productionJobRepository.getJob(event.pathParameters.id)
        if (!job) throw new createError.NotFound("Üretim işi bulunamadı.")
        const label = `${job.lotBaseNumber} numaralı iş`
        const { status, expectedVersion, outputs } = event.body

        if (job.version !== expectedVersion) {
            throw new createError.Conflict(`${label} bu arada değiştirilmiş; panoyu yenileyip tekrar deneyin.`)
        }
        if (!canTransitionJob(job.status, status)) {
            throw new createError.Conflict(`${label}: "${JOB_STATUS_LABELS[job.status]}" durumundan "${JOB_STATUS_LABELS[status]}" durumuna geçilemez.`)
        }
        if (status === "COMPLETED") {
            const issues = findJobCompletionIssues({ jobOutputIds: job.outputs.map((output) => output.id), outputs })
            if (issues.length > 0) throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))
        } else if (outputs && outputs.length > 0) {
            throw new createError.BadRequest("Sağlam / fire adedi yalnız tamamlarken girilir.")
        }

        const orders = await deps.productionJobRepository.listOrderJobStatuses(job.orderIds)
        const orderStatuses = orders.flatMap((order) => {
            const next = deriveOrderStatusFromJobs(order.status, order.jobs.map((entry) => (entry.id === job.id ? status : entry.status)))
            return next && next !== order.status ? [{ orderId: order.orderId, from: order.status, to: next }] : []
        })

        const lotOperatorSnapshots = status === "COMPLETED" ? await snapshotLotOperators(deps, job) : []
        // Raporsuz lotların baskısı kalıp sayacına tamamlamada eklenir (raporlananlar zaten eklendi).
        const moldShotIncrement = status === "COMPLETED" && outputs
            ? {
                moldId: job.moldId,
                shots: unreportedJobShots({
                    outputs: outputs.map((output) => ({
                        ...output,
                        cavities: job.outputs.find((entry) => entry.id === output.jobOutputId)?.cavities ?? 0,
                    })),
                    reportedShots: job.lots.filter((lot) => lot.reported).reduce((sum, lot) => sum + (lot.actualShots ?? 0), 0),
                }),
            }
            : null

        const saved = await deps.productionJobRepository.transitionJob({
            id: job.id,
            expectedVersion,
            fromStatus: job.status,
            userId: event.user?.id ?? null,
            moldShotIncrement,
            status,
            outputs: status === "COMPLETED" ? outputs : undefined,
            orderStatuses,
            lotOperatorSnapshots,
        })
        if (!saved) throw new createError.Conflict(`${label} bu arada değiştirilmiş; panoyu yenileyip tekrar deneyin.`)

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                job: { id: job.id, status, version: saved.version },
                orders: orderStatuses.map((order) => ({ id: order.orderId, status: order.to })),
            },
        })
    }
}
