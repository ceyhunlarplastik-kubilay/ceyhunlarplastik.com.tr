import { lambdaHandler } from "@/core/middy";
import { categoryRepository } from "@/core/helpers/prisma/categories/repository";
import { assetRepository } from "@/core/helpers/prisma/assets/repository";
import { createCategoryHandler, listCategoryHandler, getCategoryHandler, getCategoryBySlugHandler, deleteCategoryHandler, updateCategoryHandler, createCategoryAssetUploadHandler, } from "@/functions/AdminApi/functions/categories/handlers";
import { createCategoryValidator, getCategoryValidator, slugValidator, deleteCategoryValidator, updateCategoryValidator, categoryResponseValidator, listCategoryResponseValidator, createCategoryAssetUploadValidator } from "@/functions/AdminApi/validators/categories";
export const createCategory = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository(),
        assetRepository: assetRepository()
    };
    return createCategoryHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createCategoryValidator,
});
export const listCategories = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository()
    };
    return listCategoryHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: listCategoryResponseValidator,
});
export const getCategory = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository()
    };
    return getCategoryHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: getCategoryValidator,
    responseValidator: categoryResponseValidator,
});
export const getCategoryBySlug = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository()
    };
    return getCategoryBySlugHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: slugValidator,
    responseValidator: categoryResponseValidator,
});
export const deleteCategory = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository(),
        assetRepository: assetRepository(),
    };
    return deleteCategoryHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: deleteCategoryValidator,
});
export const updateCategory = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository(),
        assetRepository: assetRepository(),
    };
    return updateCategoryHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: updateCategoryValidator,
});
export const createCategoryAssetUpload = lambdaHandler(async (event) => {
    return createCategoryAssetUploadHandler()(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createCategoryAssetUploadValidator,
});
