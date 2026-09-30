import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionLotRepository } from "@/core/helpers/prisma/productionLots/repository"
import type { IPrismaProductionOperatorRepository } from "@/core/helpers/prisma/productionOperators/repository"
import type { IPrismaProductionReasonRepository } from "@/core/helpers/prisma/productionReasons/repository"
import type { IPrismaShiftAssignmentRepository } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import type { ProductionLotNoteCategory } from "@/core/helpers/production/productionLots"

export interface IProductionLotDependencies {
    productionLotRepository: IPrismaProductionLotRepository
    productionShiftAssignmentRepository: IPrismaShiftAssignmentRepository
    productionOperatorRepository: IPrismaProductionOperatorRepository
    productionReasonRepository: IPrismaProductionReasonRepository
}

/**
 * `from` / `to`: vardiya günü aralığı ("YYYY-MM-DD"); `q` verilirse tarih süzgeci uygulanmaz
 * (arama tüm lotlarda). Hiçbiri yoksa bugün + 6 gün.
 */
export type IListProductionLotsQuery = {
    page?: string
    limit?: string
    from?: string
    to?: string
    machineId?: string
    q?: string
}

export type IListProductionLotsEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, IListProductionLotsQuery | undefined>

export type IGetProductionLotEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { lotNumber: string }>

/** Lota özel ekip — boş liste lotu vardiya ekibine döndürür. */
export type IReplaceProductionLotOperatorsEvent = IAPIGatewayProxyEventWithUserGeneric<{ operatorIds: string[] }, { lotNumber: string }>

export type ICreateProductionLotNoteBody = { category: ProductionLotNoteCategory; body: string; operatorId?: string | null }

export type ICreateProductionLotNoteEvent = IAPIGatewayProxyEventWithUserGeneric<ICreateProductionLotNoteBody, { lotNumber: string }>

export type IDeleteProductionLotNoteEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

/** Lotu başlatır (anlık izleme). `startedAt` verilmezse şimdi; iyimser kilit işin sürümü. */
export type IStartProductionLotEvent = IAPIGatewayProxyEventWithUserGeneric<{ startedAt?: string; expectedVersion: number }, { lotNumber: string }>

/** Vardiya raporu — tarihler ISO; lotu kapatır (ilk raporda sıradaki lot başlar). */
export type IReportProductionLotBody = {
    actualStartAt: string
    actualEndAt: string
    actualShots?: number | null
    outputs: Array<{
        jobOutputId: string
        goodQuantity: number
        scrapQuantity: number
        scrapReasons: Array<{ reasonId: string; quantity: number }>
    }>
    stops: Array<{ reasonId: string; durationMinutes: number; startAt?: string | null; note?: string | null }>
    handoverNote?: { body: string; operatorId?: string | null } | null
    expectedVersion: number
}

export type IReportProductionLotEvent = IAPIGatewayProxyEventWithUserGeneric<IReportProductionLotBody, { lotNumber: string }>
