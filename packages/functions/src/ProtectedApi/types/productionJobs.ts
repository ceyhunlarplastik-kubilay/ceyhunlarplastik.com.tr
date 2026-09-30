import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import type { IPrismaShiftAssignmentRepository } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import type { JobCompletionOutput, ProductionJobStatus } from "@/core/helpers/production/jobStateMachine"

export interface IProductionJobDependencies {
    productionJobRepository: IPrismaProductionJobRepository
    productionShiftAssignmentRepository: IPrismaShiftAssignmentRepository
}

export type IGetProductionKanbanEvent = IAPIGatewayProxyEventWithUserGeneric<unknown>

/** Pano geçişi; `outputs` yalnız tamamlarken (her çıktı için sağlam + fire). */
export type ITransitionProductionJobBody = {
    status: Exclude<ProductionJobStatus, "CANCELLED">
    expectedVersion: number
    outputs?: JobCompletionOutput[]
}

export type ITransitionProductionJobEvent = IAPIGatewayProxyEventWithUserGeneric<ITransitionProductionJobBody, { id: string }>
