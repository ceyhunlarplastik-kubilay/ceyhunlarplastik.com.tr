import { lambdaHandler } from "@/core/middy";
import { categoryRepository } from "@/core/helpers/prisma/categories/repository";
import { listCategoriesHandler, getCategoryHandler, getCategoryBySlugHandler } from "@/functions/PublicApi/functions/categories/handlers";
import { idValidator, slugValidator, categoryResponseValidator, listCategoryResponseValidator } from "@/functions/PublicApi/validators/categories";
export const listCategories = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository()
    };
    return listCategoriesHandler(deps)(event);
}, {
    auth: false,
    responseValidator: listCategoryResponseValidator,
});
export const getCategory = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository()
    };
    return getCategoryHandler(deps)(event);
}, {
    auth: false,
    requestValidator: idValidator,
    responseValidator: categoryResponseValidator,
});
export const getCategoryBySlug = lambdaHandler(async (event) => {
    const deps = {
        categoryRepository: categoryRepository()
    };
    return getCategoryBySlugHandler(deps)(event);
}, {
    auth: false,
    requestValidator: slugValidator,
    responseValidator: categoryResponseValidator,
});
