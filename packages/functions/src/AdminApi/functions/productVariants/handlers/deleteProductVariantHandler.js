import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { Prisma } from "@/prisma/generated/prisma/client";
export const deleteProductVariantHandler = ({ productVariantRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const deleted = await productVariantRepository.deleteProductVariant(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: deleted },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025")
                    throw new createError.NotFound("ProductVariant not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product variant");
        }
    };
};
