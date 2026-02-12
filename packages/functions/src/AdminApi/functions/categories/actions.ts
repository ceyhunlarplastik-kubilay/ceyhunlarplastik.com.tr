import { lambdaHandler } from "@/core/middy"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import {
    createCategoryHandler,
    listCategoryHandler,
    getCategoryHandler,
    deleteCategoryHandler,
    updateCategoryHandler,
} from "@/functions/AdminApi/functions/categories/handlers";
import {
    createCategoryValidator,
    getCategoryValidator,
    deleteCategoryValidator,
    updateCategoryValidator,
    categoryResponseValidator,
    listCategoryResponseValidator,
} from "@/functions/AdminApi/validators/categories"
import type {
    ICreateCategoryDependencies,
    ICreateCategoryEvent,
    IListCategoriesDependencies,
    IListCategoriesEvent,
    IGetCategoryDependencies,
    IGetCategoryEvent,
    IDeleteCategoryDependencies,
    IDeleteCategoryEvent,
    IUpdateCategoryDependencies,
    IUpdateCategoryEvent
} from "@/functions/AdminApi/types/categories"

export const createCategory = lambdaHandler(
    async (event) => {
        const deps: ICreateCategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return createCategoryHandler(deps)(
            event as ICreateCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createCategoryValidator,
    }
)

export const listCategories = lambdaHandler(
    async (event) => {
        const deps: IListCategoriesDependencies = {
            categoryRepository: categoryRepository()
        }

        return listCategoryHandler(deps)(
            event as IListCategoriesEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listCategoryResponseValidator,
    }
)

export const getCategory = lambdaHandler(
    async (event) => {
        const deps: IGetCategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return getCategoryHandler(deps)(
            event as IGetCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: getCategoryValidator,
        responseValidator: categoryResponseValidator,
    }
)

export const deleteCategory = lambdaHandler(
    async (event) => {
        const deps: IDeleteCategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return deleteCategoryHandler(deps)(
            event as IDeleteCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: deleteCategoryValidator,
    }
)

export const updateCategory = lambdaHandler(
    async (event) => {
        const deps: IUpdateCategoryDependencies = {
            categoryRepository: categoryRepository()
        }
        return updateCategoryHandler(deps)(
            event as IUpdateCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateCategoryValidator,
    }
)