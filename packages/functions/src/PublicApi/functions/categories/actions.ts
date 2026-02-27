import { lambdaHandler } from "@/core/middy"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { listCategoriesHandler, getCategoryHandler, getCategoryBySlugHandler } from "@/functions/PublicApi/functions/categories/handlers";
import { idValidator, slugValidator, categoryResponseValidator, listCategoryResponseValidator } from "@/functions/PublicApi/validators/categories"
import type { ICategoryDependencies, IListCategoriesEvent, IGetCategoryEvent, IGetCategoryBySlugEvent } from "@/functions/PublicApi/types/categories"

export const listCategories = lambdaHandler(
    async (event) => {
        const deps: ICategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return listCategoriesHandler(deps)(
            event as IListCategoriesEvent
        )
    },
    {
        auth: false,
        responseValidator: listCategoryResponseValidator,
    }
)

export const getCategory = lambdaHandler(
    async (event) => {
        const deps: ICategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return getCategoryHandler(deps)(
            event as IGetCategoryEvent
        )
    },
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: categoryResponseValidator,
    }
)

export const getCategoryBySlug = lambdaHandler(
    async (event) => {
        const deps: ICategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return getCategoryBySlugHandler(deps)(
            event as IGetCategoryBySlugEvent
        )
    },
    {
        auth: false,
        requestValidator: slugValidator,
        responseValidator: categoryResponseValidator,
    }
)
