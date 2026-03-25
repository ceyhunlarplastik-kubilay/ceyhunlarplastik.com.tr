import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"

export interface IProductAttributeDependencies {
    productAttributeRepository: IPrismaProductAttributeRepository
}

export type IListAttributesWithValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, {}, {}>
