import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { ProductionCalendarExceptionKind } from "@/prisma/generated/prisma/client"

export interface IProductionCalendarExceptionDependencies {
    productionCalendarExceptionRepository: IPrismaProductionCalendarExceptionRepository
    productionAreaRepository: IPrismaProductionAreaRepository
    productionMachineRepository: IPrismaProductionMachineRepository
}

/**
 * Bir takvim kaydı (aralık). Günlere açılarak yazılır. `replaceIds` doluysa istek bir
 * DÜZENLEMEDİR: o günler silinip yerine bu kayıt yazılır (tek transaction).
 */
export type ICalendarExceptionEntryBody = {
    startDate: string
    endDate?: string | null
    kind: ProductionCalendarExceptionKind
    note?: string | null
    areaId?: string | null
    machineId?: string | null
    replaceIds?: string[]
}

export type IListCalendarExceptionsEvent = IAPIGatewayProxyEventWithUserGeneric<
    unknown,
    unknown,
    { from?: string; to?: string } | undefined
>

export type ISaveCalendarExceptionEntryEvent = IAPIGatewayProxyEventWithUserGeneric<ICalendarExceptionEntryBody>

export type IBulkDeleteCalendarExceptionsEvent = IAPIGatewayProxyEventWithUserGeneric<{ ids: string[] }>
