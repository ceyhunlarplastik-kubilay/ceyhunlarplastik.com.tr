import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ISupplierDependencies, IGetSupplierEvent } from "@/functions/PublicApi/types/suppliers"

export const getSupplierHandler = ({ supplierRepository }: ISupplierDependencies) => {
    return async (event: IGetSupplierEvent) => {
        const { id } = event.pathParameters;

        try {
            const supplier = await supplierRepository.getSupplier(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Supplier not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get supplier");
        }
    }
}
