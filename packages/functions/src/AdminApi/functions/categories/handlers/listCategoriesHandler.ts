import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IListCategoriesDependencies, IListCategoriesEvent } from "@/functions/AdminApi/types/categories"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

export const listCategoryHandler = ({ categoryRepository }: IListCategoriesDependencies) => {
    return async (event: IListCategoriesEvent) => {
        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "code",
            })

        try {
            const result = await categoryRepository.listCategories({
                page,
                limit,
                search,
                sort,
                order,
            })

            return apiResponse({
                statusCode: 200,
                payload: result,
            })
        } catch (err: any) {
            console.error(err)
            throw new createError.InternalServerError("An error occurred while listing categories");
        }
    }
}
