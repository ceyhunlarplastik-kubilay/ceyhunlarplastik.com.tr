import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IListCategoriesDependencies, IListCategoriesEvent } from "@/functions/AdminApi/types/categories"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"
import { getSupportedLocale } from "@/core/i18n/locales"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

export const listCategoryHandler = ({ categoryRepository }: IListCategoriesDependencies) => {
    return async (event: IListCategoriesEvent) => {
        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "code",
                maxLimit: 500,
            })
        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        try {
            const result = await categoryRepository.listCategories({
                page,
                limit,
                search,
                sort,
                order,
                locale,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map(mapCategoryWithAssets),
                    meta: result.meta,
                },
            })
        } catch (err: any) {
            console.error(err)
            throw new createError.InternalServerError("An error occurred while listing categories");
        }
    }
}
