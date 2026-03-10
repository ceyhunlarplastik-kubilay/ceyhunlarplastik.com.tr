import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"

export interface IProductDependencies {
    productRepository: IPrismaProductRepository
    categoryRepository: IPrismaCategoryRepository
}

export interface IProductVariantTableDependencies {
    productVariantRepository: IPrismaProductVariantRepository
}

export type IGetProductEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IGetProductBySlugEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { slug: string }>

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

export type IGetProductVariantTableEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        { id: string },
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
        }
    >
