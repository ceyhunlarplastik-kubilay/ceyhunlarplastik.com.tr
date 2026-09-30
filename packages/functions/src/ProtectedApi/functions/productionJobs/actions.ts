import { lambdaHandler } from "@/core/middy"
import { productionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import { productionShiftAssignmentRepository } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import { getProductionKanbanHandler, transitionProductionJobHandler } from "@/functions/ProtectedApi/functions/productionJobs/handlers"
import {
    productionKanbanResponseValidator,
    transitionProductionJobResponseValidator,
    transitionProductionJobValidator,
} from "@/functions/ProtectedApi/validators/productionJobs"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type { IGetProductionKanbanEvent, ITransitionProductionJobEvent } from "@/functions/ProtectedApi/types/productionJobs"

const deps = () => ({
    productionJobRepository: productionJobRepository(),
    productionShiftAssignmentRepository: productionShiftAssignmentRepository(),
})

export const getProductionKanban = lambdaHandler(
    async (event) => getProductionKanbanHandler(deps())(event as IGetProductionKanbanEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: productionKanbanResponseValidator,
    },
)

/** Pano geçişi — durum makinesi core'da; emir durumu aynı transaction'da türetilir. */
export const transitionProductionJob = lambdaHandler(
    withProductionChange("plan", async (event) => transitionProductionJobHandler(deps())(event as ITransitionProductionJobEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: transitionProductionJobValidator,
        responseValidator: transitionProductionJobResponseValidator,
    },
)
