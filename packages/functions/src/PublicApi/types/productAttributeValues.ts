import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export interface IProductAttributeValueDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

export type IListProductAttributeValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { attributeId: string }>
