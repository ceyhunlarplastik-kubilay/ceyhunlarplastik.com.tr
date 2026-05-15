import createError from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getProductVariantHandler = ({ productVariantRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const variant = await productVariantRepository.getProductVariant(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: variant },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Product not found");
            throw new createError.InternalServerError("Failed to get product");
        }
    };
};
