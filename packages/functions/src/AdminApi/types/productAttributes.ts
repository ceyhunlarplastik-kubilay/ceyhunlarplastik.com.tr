import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"

export interface IProductAttributeDependencies {
    productAttributeRepository: IPrismaProductAttributeRepository
}

export interface ICreateProductAttributeBody {
    code: string
    name: string
    displayOrder?: number
}

export type ICreateProductAttributeEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAttributeBody>

export type IListProductAttributesEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
        }
    >

// Pagination yok sanırım
export type IListAttributesWithValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, {}>

export type IUpdateProductAttributeEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductAttributeBody>,
        { id: string }
    >

export type IGetProductAttributeEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteProductAttributeEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>
