import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { IPrismaProductionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import type { IPrismaProductionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import type { IPrismaProductionStatsRepository } from "@/core/helpers/prisma/productionStats/repository"

export interface IProductionStatsDependencies {
    productionReferenceRepository: Pick<IPrismaProductionReferenceRepository, "getProductSizes">
    productionStatsRepository: Pick<IPrismaProductionStatsRepository, "listProductVersions" | "listProductHistoryJobs">
}

export interface IMachineStatsDependencies {
    productionMachineRepository: Pick<IPrismaProductionMachineRepository, "listMachines">
    productionAreaRepository: Pick<IPrismaProductionAreaRepository, "listAreas">
    productionShiftPatternRepository: Pick<IPrismaProductionShiftPatternRepository, "listShiftPatterns">
    productionCalendarExceptionRepository: Pick<IPrismaProductionCalendarExceptionRepository, "listExceptions">
    productionMachineDowntimeRepository: Pick<IPrismaProductionMachineDowntimeRepository, "listDowntimes">
    productionStatsRepository: Pick<IPrismaProductionStatsRepository, "listMachineReportedLots" | "listMachineUnreportedLots">
}

export interface IMoldStatsDependencies {
    productionMoldRepository: Pick<IPrismaProductionMoldRepository, "listMolds">
    productionStatsRepository: Pick<IPrismaProductionStatsRepository, "listMoldStatsLots" | "listOpenJobShots" | "listVersionLabels">
}

/**
 * Ürün geçmişi süzgeci. `version` = versiyon imzası (renk + hammadde); tarihler fabrika günü
 * ("YYYY-MM-DD", iki uç dahil) — verilmezse son 12 ay.
 */
export type IGetProductHistoryQuery = {
    productId: string
    sizeId?: string
    version?: string
    from?: string
    to?: string
}

export type IGetProductHistoryEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, IGetProductHistoryQuery>

/** Makine kullanımı ve OEE süzgeci — tarihler fabrika günü, verilmezse son 30 gün; `areaId` üretim alanı. */
export type IGetMachineStatsQuery = {
    from?: string
    to?: string
    areaId?: string
}

export type IGetMachineStatsEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, IGetMachineStatsQuery | undefined>

/** Kalıp istatistiği penceresi — fabrika günleri, verilmezse son 90 gün. */
export type IGetMoldStatsQuery = { from?: string; to?: string }

export type IGetMoldStatsEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, IGetMoldStatsQuery | undefined>
