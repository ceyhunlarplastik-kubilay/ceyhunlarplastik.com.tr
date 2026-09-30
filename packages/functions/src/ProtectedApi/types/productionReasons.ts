import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionReasonRepository } from "@/core/helpers/prisma/productionReasons/repository"
import type { ProductionReasonKind, ProductionStopCategory } from "@/core/helpers/production/productionReasons"

export interface IProductionReasonDependencies {
    productionReasonRepository: IPrismaProductionReasonRepository
}

export type IProductionReasonBody = {
    kind: ProductionReasonKind
    code: string
    name: string
    stopCategory?: ProductionStopCategory | null
    isActive?: boolean
    sortOrder?: number
}

/** Tür değiştirilemez (raporlar nedene türüyle bağlı). */
export type IUpdateProductionReasonBody = Partial<Omit<IProductionReasonBody, "kind">>

export type IListProductionReasonsEvent = IAPIGatewayProxyEventWithUserGeneric<unknown>
export type ICreateProductionReasonEvent = IAPIGatewayProxyEventWithUserGeneric<IProductionReasonBody>
export type IUpdateProductionReasonEvent = IAPIGatewayProxyEventWithUserGeneric<IUpdateProductionReasonBody, { id: string }>
export type IDeleteProductionReasonEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>
export type ICreateDefaultProductionReasonsEvent = IAPIGatewayProxyEventWithUserGeneric<unknown>
