import createError from "http-errors";
import { safeNumber } from "@/core/helpers/utils/number";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listProductVariantsHandler = ({ productVariantRepository }) => {
    return async (event) => {
        const { page, limit, search, sort, order, productId } = event.queryStringParameters ?? {};
        try {
            const result = await productVariantRepository.listProductVariants({
                page: safeNumber(page),
                limit: safeNumber(limit),
                search,
                sort,
                order,
                productId,
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            });
        }
        catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to list product variants");
        }
    };
};
