import { lambdaHandler } from "@/core/middy"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { listCategoriesHandler, getCategoryHandler } from "@/functions/PublicApi/functions/categories/handlers";
import { idValidator, categoryResponseValidator, listCategoryResponseValidator } from "@/functions/PublicApi/validators/categories"
import type { ICategoryDependencies, IListCategoriesEvent, IGetCategoryEvent } from "@/functions/PublicApi/types/categories"

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
