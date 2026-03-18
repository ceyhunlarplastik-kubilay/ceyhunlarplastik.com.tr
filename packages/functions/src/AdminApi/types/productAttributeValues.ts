import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export interface IProductAttributeValueDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

export interface ICreateProductAttributeValueBody {
    name: string
    attributeId: string
    displayOrder?: number
}

export type ICreateProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAttributeValueBody>

export type IListProductAttributeValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { attributeId: string }>

export type IUpdateProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductAttributeValueBody>,
        { id: string }
    >

export type IDeleteProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>
