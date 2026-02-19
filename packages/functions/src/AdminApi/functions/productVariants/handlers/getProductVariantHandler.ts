import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IGetProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

export const getProductVariantHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IGetProductVariantEvent) => {

        const { id } = event.pathParameters;

        try {
            const variant = await productVariantRepository.getProductVariant(id);
            if (!variant) throw new createError.NotFound("ProductVariant not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: variant },
            });
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to get product variant");
        }
    }
}
