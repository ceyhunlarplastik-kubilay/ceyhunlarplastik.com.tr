import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"

export interface IProductionAreaDependencies {
    productionAreaRepository: IPrismaProductionAreaRepository
    productionShiftPatternRepository: IPrismaProductionShiftPatternRepository
}

export type IProductionAreaBody = {
    code: string
    name: string
    sortOrder?: number
    isActive?: boolean
    notes?: string | null
    shiftPatternId?: string | null
}

export type IListProductionAreasEvent = IAPIGatewayProxyEventWithUserGeneric

export type ICreateProductionAreaEvent = IAPIGatewayProxyEventWithUserGeneric<IProductionAreaBody>

export type IUpdateProductionAreaEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<IProductionAreaBody>,
    { id: string }
>

export type IDeleteProductionAreaEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>
