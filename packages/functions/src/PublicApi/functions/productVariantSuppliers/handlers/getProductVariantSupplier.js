import createError, { HttpError } from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getProductVariantSupplierHandler = ({ productVariantSupplierRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const productVariantSupplier = await productVariantSupplierRepository.getProductVariantSupplier(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariantSupplier },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Product variant supplier not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get product variant supplier");
        }
    };
};
