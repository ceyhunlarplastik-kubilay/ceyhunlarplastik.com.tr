import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IListProductVariantsEvent } from "@/functions/AdminApi/types/productVariants"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["fullCode", "name", "createdAt"] as const

export const listProductVariantsHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IListProductVariantsEvent) => {
        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "fullCode",
            })

        try {
            const result = await productVariantRepository.listProductVariants({
                page,
                limit,
                search,
                sort,
                order,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to list product variants");
        }
    }
}
