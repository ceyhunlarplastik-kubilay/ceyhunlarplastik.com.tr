import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import { productionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import { productionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import { productionOrderRepository } from "@/core/helpers/prisma/productionOrders/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import { getProductionBoardHandler } from "@/functions/ProtectedApi/functions/productionBoard/handlers"
import { getProductionBoardValidator, productionBoardResponseValidator } from "@/functions/ProtectedApi/validators/productionBoard"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import type { IGetProductionBoardEvent } from "@/functions/ProtectedApi/types/productionBoard"

const deps = () => ({
    productionMachineRepository: productionMachineRepository(),
    productionAreaRepository: productionAreaRepository(),
    productionShiftPatternRepository: productionShiftPatternRepository(),
    productionCalendarExceptionRepository: productionCalendarExceptionRepository(),
    productionMachineDowntimeRepository: productionMachineDowntimeRepository(),
    productionJobRepository: productionJobRepository(),
    productionMoldRepository: productionMoldRepository(),
    productionOrderRepository: productionOrderRepository(),
})

export const getProductionBoard = lambdaHandler(
    async (event) => getProductionBoardHandler(deps())(event as IGetProductionBoardEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getProductionBoardValidator,
        responseValidator: productionBoardResponseValidator,
    },
)
