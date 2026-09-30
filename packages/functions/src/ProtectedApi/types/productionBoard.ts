import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { IPrismaProductionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import type { IPrismaProductionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import type { IPrismaProductionOrderRepository } from "@/core/helpers/prisma/productionOrders/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"

export interface IProductionBoardDependencies {
    productionMachineRepository: IPrismaProductionMachineRepository
    productionAreaRepository: IPrismaProductionAreaRepository
    productionShiftPatternRepository: IPrismaProductionShiftPatternRepository
    productionCalendarExceptionRepository: IPrismaProductionCalendarExceptionRepository
    productionMachineDowntimeRepository: IPrismaProductionMachineDowntimeRepository
    productionJobRepository: IPrismaProductionJobRepository
    productionMoldRepository: IPrismaProductionMoldRepository
    productionOrderRepository: IPrismaProductionOrderRepository
}

/** "YYYY-MM-DD" — fabrika takviminde, iki uç dahil. Verilmezse bugün + 6 gün. */
export type IGetProductionBoardQuery = { from?: string; to?: string }

export type IGetProductionBoardEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, IGetProductionBoardQuery | undefined>
