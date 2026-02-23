import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"

export interface IProductDependencies {
    productRepository: IPrismaProductRepository
    categoryRepository: IPrismaCategoryRepository
}

export type IGetProductEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListProductsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            categoryId?: string
        }
    >
