import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import { productionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import { productionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionMaterialProfileRepository } from "@/core/helpers/prisma/productionMaterialProfiles/repository"
import { productionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import { productionOrderRepository } from "@/core/helpers/prisma/productionOrders/repository"
import { productionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import {
    createProductionOrderHandler,
    deleteProductionJobHandler,
    deleteProductionOrderHandler,
    getProductionOrderCandidatesHandler,
    listProductionOrdersHandler,
    planProductionOrderHandler,
    pushJobFollowersHandler,
    rescheduleProductionJobHandler,
    updateProductionOrderHandler,
} from "@/functions/ProtectedApi/functions/productionOrders/handlers"
import {
    createProductionOrderValidator,
    deleteProductionJobResponseValidator,
    deleteProductionJobValidator,
    deleteProductionOrderResponseValidator,
    deleteProductionOrderValidator,
    getProductionOrderCandidatesValidator,
    listProductionOrdersResponseValidator,
    listProductionOrdersValidator,
    planProductionOrderValidator,
    productionOrderCandidatesResponseValidator,
    planProductionOrderResponseValidator,
    productionOrderResponseValidator,
    pushJobFollowersResponseValidator,
    pushJobFollowersValidator,
    rescheduleProductionJobResponseValidator,
    rescheduleProductionJobValidator,
    updateProductionOrderValidator,
} from "@/functions/ProtectedApi/validators/productionOrders"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateProductionOrderEvent,
    IDeleteProductionJobEvent,
    IDeleteProductionOrderEvent,
    IGetProductionOrderCandidatesEvent,
    IListProductionOrdersEvent,
    IPlanProductionOrderEvent,
    IPushJobFollowersEvent,
    IRescheduleProductionJobEvent,
    IUpdateProductionOrderEvent,
} from "@/functions/ProtectedApi/types/productionOrders"

const deps = () => ({
    productionOrderRepository: productionOrderRepository(),
    productionReferenceRepository: productionReferenceRepository(),
})

export const listProductionOrders = lambdaHandler(
    async (event) => listProductionOrdersHandler(deps())(event as IListProductionOrdersEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: listProductionOrdersValidator,
        responseValidator: listProductionOrdersResponseValidator,
    },
)

export const createProductionOrder = lambdaHandler(
    withProductionChange("plan", async (event) => createProductionOrderHandler(deps())(event as ICreateProductionOrderEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createProductionOrderValidator,
        responseValidator: productionOrderResponseValidator,
    },
)

export const updateProductionOrder = lambdaHandler(
    withProductionChange("plan", async (event) => updateProductionOrderHandler(deps())(event as IUpdateProductionOrderEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: updateProductionOrderValidator,
        responseValidator: productionOrderResponseValidator,
    },
)

export const deleteProductionOrder = lambdaHandler(
    withProductionChange("plan", async (event) => deleteProductionOrderHandler(deps())(event as IDeleteProductionOrderEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteProductionOrderValidator,
        responseValidator: deleteProductionOrderResponseValidator,
    },
)

const planningDeps = () => ({
    productionOrderRepository: productionOrderRepository(),
    productionMoldRepository: productionMoldRepository(),
    productionMachineRepository: productionMachineRepository(),
    productionAreaRepository: productionAreaRepository(),
    productionShiftPatternRepository: productionShiftPatternRepository(),
    productionCalendarExceptionRepository: productionCalendarExceptionRepository(),
    productionMachineDowntimeRepository: productionMachineDowntimeRepository(),
    productionMaterialProfileRepository: productionMaterialProfileRepository(),
    productionJobRepository: productionJobRepository(),
})

export const getProductionOrderCandidates = lambdaHandler(
    async (event) => getProductionOrderCandidatesHandler(planningDeps())(event as IGetProductionOrderCandidatesEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getProductionOrderCandidatesValidator,
        responseValidator: productionOrderCandidatesResponseValidator,
    },
)

/** "Planla": seçilen adayı işe + vardiya lotlarına çevirir (plan sunucuda yeniden hesaplanır). */
export const planProductionOrder = lambdaHandler(
    withProductionChange("plan", async (event) => planProductionOrderHandler(planningDeps())(event as IPlanProductionOrderEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: planProductionOrderValidator,
        responseValidator: planProductionOrderResponseValidator,
    },
)

export const deleteProductionJob = lambdaHandler(
    withProductionChange("plan", async (event) => deleteProductionJobHandler(planningDeps())(event as IDeleteProductionJobEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteProductionJobValidator,
        responseValidator: deleteProductionJobResponseValidator,
    },
)

/** Tahtada taşıma (sürükle-bırak ya da "Taşı" formu); iyimser kilit `expectedVersion`. */
export const rescheduleProductionJob = lambdaHandler(
    withProductionChange("plan", async (event) => rescheduleProductionJobHandler(planningDeps())(event as IRescheduleProductionJobEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: rescheduleProductionJobValidator,
        responseValidator: rescheduleProductionJobResponseValidator,
    },
)

/** Gecikme önerisi: geciken işin tahmini bitişine göre makinedeki planlı işleri kaydırır. */
export const pushJobFollowers = lambdaHandler(
    withProductionChange("plan", async (event) => pushJobFollowersHandler(planningDeps())(event as IPushJobFollowersEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: pushJobFollowersValidator,
        responseValidator: pushJobFollowersResponseValidator,
    },
)
