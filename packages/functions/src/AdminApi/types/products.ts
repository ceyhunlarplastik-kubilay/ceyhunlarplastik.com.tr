import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"

export interface IListProductsQueryParams {
    page?: string
    limit?: string
    search?: string
    sort?: "code" | "name" | "createdAt"
    order?: "asc" | "desc"
    categoryId?: string
}

export type IListProductsEvent =
    IAPIGatewayProxyEventWithUser & {
        queryStringParameters?: IListProductsQueryParams
    }

export interface IListProductsDependencies {
    productRepository: IPrismaProductRepository
}
