import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"

export interface ICreateCategoryBody {
    code: number
    name: string
}

export type ICreateCategoryEvent =
    IAPIGatewayProxyEventWithUser<ICreateCategoryBody>

export interface IListCategoriesQueryParams {
    page?: string
    limit?: string
    search?: string
    sort?: "code" | "name" | "createdAt"
    order?: "asc" | "desc"
}

export type IListCategoriesEvent =
    IAPIGatewayProxyEventWithUser & {
        queryStringParameters?: IListCategoriesQueryParams
    }

export type IGetCategoryEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
    }

export type IDeleteCategoryEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
    }

export type IUpdateCategoryEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
        body: Partial<{
            code: string
            name: string
        }>
    }


export interface IGetCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository
}

export interface IListCategoriesDependencies extends IGetCategoryDependencies { }

export interface ICreateCategoryDependencies extends IGetCategoryDependencies { }

export interface IDeleteCategoryDependencies extends IGetCategoryDependencies { }

export interface IUpdateCategoryDependencies extends IGetCategoryDependencies { }