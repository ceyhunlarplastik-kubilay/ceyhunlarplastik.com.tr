import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets";
const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"];
export const listCategoryHandler = ({ categoryRepository }) => {
    return async (event) => {
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "code",
        });
        try {
            const result = await categoryRepository.listCategories({
                page,
                limit,
                search,
                sort,
                order,
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map(mapCategoryWithAssets),
                    meta: result.meta,
                },
            });
        }
        catch (err) {
            console.error(err);
            throw new createError.InternalServerError("An error occurred while listing categories");
        }
    };
};
