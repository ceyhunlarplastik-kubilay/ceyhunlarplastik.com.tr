import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionOperatorRepository } from "@/core/helpers/prisma/productionOperators/repository"

export interface IProductionOperatorDependencies {
    productionOperatorRepository: IPrismaProductionOperatorRepository
}

export type IProductionOperatorBody = {
    firstName: string
    lastName: string
    employeeNo?: string | null
    phone?: string | null
    isActive?: boolean
    notes?: string | null
}

export type IListProductionOperatorsEvent = IAPIGatewayProxyEventWithUserGeneric

export type ICreateProductionOperatorEvent = IAPIGatewayProxyEventWithUserGeneric<IProductionOperatorBody>

export type IUpdateProductionOperatorEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<IProductionOperatorBody>,
    { id: string }
>

export type IDeleteProductionOperatorEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>
