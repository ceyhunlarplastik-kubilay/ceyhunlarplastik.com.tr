import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductDependencies, IGetProductEvent } from "@/functions/AdminApi/types/products"

export const getProductHandler = ({ productRepository }: Pick<IProductDependencies, "productRepository">) => {
    return async (event: IGetProductEvent) => {
        const { id } = event.pathParameters;

        try {
            const product = await productRepository.getProduct(id);
            if (!product) throw new createError.NotFound("Product not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { product },
            });
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to get product");
        }
    }
}
