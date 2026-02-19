import createError from "http-errors"
import { safeNumber } from "@/core/helpers/utils/number"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IListProductVariantsEvent } from "@/functions/AdminApi/types/productVariants"

export const listProductVariantsHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IListProductVariantsEvent) => {

        const { page, limit, search, sort, order } = event.queryStringParameters ?? {};

        try {
            const result = await productVariantRepository.listProductVariants({
                page: safeNumber(page),
                limit: safeNumber(limit),
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
