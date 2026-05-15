import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { Prisma } from "@/prisma/generated/prisma/client";
export const deleteProductHandler = ({ productRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const deleted = await productRepository.deleteProduct(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { product: deleted },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Product not found");
            throw new createError.InternalServerError("Failed to delete product");
        }
    };
};
