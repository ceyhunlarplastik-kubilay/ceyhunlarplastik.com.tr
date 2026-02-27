import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"

export interface ICategoryDependencies {
    categoryRepository: IPrismaCategoryRepository
}
export type IGetCategoryEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IGetCategoryBySlugEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { slug: string }>

export type IListCategoriesEvent =
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
