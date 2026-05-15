import createError from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets";
export const getProductHandler = ({ productRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const product = await productRepository.getProduct(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { product: mapProductWithAssets(product) },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Product not found");
            throw new createError.InternalServerError("Failed to get product");
        }
    };
};
