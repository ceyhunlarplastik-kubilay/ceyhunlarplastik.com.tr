import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import { productionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import { productionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import { productionStatsRepository } from "@/core/helpers/prisma/productionStats/repository"
import { getMachineStatsHandler, getMoldStatsHandler, getProductHistoryHandler } from "@/functions/ProtectedApi/functions/productionStats/handlers"
import {
    getMachineStatsValidator,
    getMoldStatsValidator,
    getProductHistoryValidator,
    machineStatsResponseValidator,
    moldStatsResponseValidator,
    productHistoryResponseValidator,
} from "@/functions/ProtectedApi/validators/productionStats"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import type { IGetMachineStatsEvent, IGetMoldStatsEvent, IGetProductHistoryEvent } from "@/functions/ProtectedApi/types/productionStats"

const deps = () => ({
    productionReferenceRepository: productionReferenceRepository(),
    productionStatsRepository: productionStatsRepository(),
})

const machineStatsDeps = () => ({
    productionMachineRepository: productionMachineRepository(),
    productionAreaRepository: productionAreaRepository(),
    productionShiftPatternRepository: productionShiftPatternRepository(),
    productionCalendarExceptionRepository: productionCalendarExceptionRepository(),
    productionMachineDowntimeRepository: productionMachineDowntimeRepository(),
    productionStatsRepository: productionStatsRepository(),
})

const moldStatsDeps = () => ({
    productionMoldRepository: productionMoldRepository(),
    productionStatsRepository: productionStatsRepository(),
})

/** Ürün geçmişi (Faz 5.1) — salt okunur. */
export const getProductHistory = lambdaHandler(
    async (event) => getProductHistoryHandler(deps())(event as IGetProductHistoryEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getProductHistoryValidator,
        responseValidator: productHistoryResponseValidator,
    },
)

/** Makine kullanımı ve OEE (Faz 5.2) — salt okunur. */
export const getMachineStats = lambdaHandler(
    async (event) => getMachineStatsHandler(machineStatsDeps())(event as IGetMachineStatsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getMachineStatsValidator,
        responseValidator: machineStatsResponseValidator,
    },
)

/** Kalıp istatistikleri ve çevrim önerisi (Faz 5.3) — salt okunur; öneri ayrı uçla karta yazılır. */
export const getMoldStats = lambdaHandler(
    async (event) => getMoldStatsHandler(moldStatsDeps())(event as IGetMoldStatsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getMoldStatsValidator,
        responseValidator: moldStatsResponseValidator,
    },
)
