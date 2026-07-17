import { lambdaHandler } from "@/core/middy"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { assetRepository } from "@/core/helpers/prisma/assets/repository"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import {
    createCategoryHandler,
    listCategoryHandler,
    getCategoryHandler,
    getCategoryBySlugHandler,
    deleteCategoryHandler,
    updateCategoryHandler,
    createCategoryAssetUploadHandler,
} from "@/functions/AdminApi/functions/categories/handlers";
import {
    createCategoryValidator,
    listCategoriesValidator,
    getCategoryValidator,
    slugValidator,
    deleteCategoryValidator,
    updateCategoryValidator,
    categoryResponseValidator,
    listCategoryResponseValidator,
    createCategoryAssetUploadValidator
} from "@/functions/AdminApi/validators/categories"
import type {
    ICreateCategoryDependencies,
    ICreateCategoryEvent,
    IListCategoriesDependencies,
    IListCategoriesEvent,
    IGetCategoryDependencies,
    IGetCategoryEvent,
    IGetCategoryBySlugEvent,
    IDeleteCategoryDependencies,
    IDeleteCategoryEvent,
    IUpdateCategoryDependencies,
    IUpdateCategoryEvent,
    ICreateCategoryAssetUploadEvent,
} from "@/functions/AdminApi/types/categories"

const categoryManagerGroups = ["admin", "content_editor"]

export const createCategory = lambdaHandler(
    async (event) => {
        const deps: ICreateCategoryDependencies = {
            categoryRepository: categoryRepository(),
            assetRepository: assetRepository(),
            productAttributeValueRepository: productAttributeValueRepository(),
        }

        return createCategoryHandler(deps)(
            event as ICreateCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: categoryManagerGroups },
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
        auth: { requiredPermissionGroups: categoryManagerGroups },
        requestValidator: listCategoriesValidator,
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
        auth: { requiredPermissionGroups: categoryManagerGroups },
        requestValidator: getCategoryValidator,
        responseValidator: categoryResponseValidator,
    }
)

export const getCategoryBySlug = lambdaHandler(
    async (event) => {
        const deps: IGetCategoryDependencies = {
            categoryRepository: categoryRepository()
        }

        return getCategoryBySlugHandler(deps)(
            event as IGetCategoryBySlugEvent
        )
    },
    {
        auth: { requiredPermissionGroups: categoryManagerGroups },
        requestValidator: slugValidator,
        responseValidator: categoryResponseValidator,
    }
)

export const deleteCategory = lambdaHandler(
    async (event) => {
        const deps: IDeleteCategoryDependencies = {
            categoryRepository: categoryRepository(),
            assetRepository: assetRepository(),
        }

        return deleteCategoryHandler(deps)(
            event as IDeleteCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: categoryManagerGroups },
        requestValidator: deleteCategoryValidator,
    }
)

export const updateCategory = lambdaHandler(
    async (event) => {
        const deps: IUpdateCategoryDependencies = {
            categoryRepository: categoryRepository(),
            assetRepository: assetRepository(),
            productAttributeValueRepository: productAttributeValueRepository(),
        }
        return updateCategoryHandler(deps)(
            event as IUpdateCategoryEvent
        )
    },
    {
        auth: { requiredPermissionGroups: categoryManagerGroups },
        requestValidator: updateCategoryValidator,
    }
)

export const createCategoryAssetUpload = lambdaHandler(
    async (event) => {
        return createCategoryAssetUploadHandler()(
            event as ICreateCategoryAssetUploadEvent
        )
    },
    {
        auth: { requiredPermissionGroups: categoryManagerGroups },
        requestValidator: createCategoryAssetUploadValidator,
    }
)
