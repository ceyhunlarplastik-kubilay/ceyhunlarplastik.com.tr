import createError, { HttpError } from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getSupplierHandler = ({ supplierRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const supplier = await supplierRepository.getSupplier(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Supplier not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get supplier");
        }
    };
};
