import createError, { HttpError } from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IDeleteProductSupplierDependencies, IDeleteProductSupplierEvent } from "@/functions/AdminApi/types/productSuppliers"

// Hard delete bırakıyoruz şimdilik
export const deleteProductSupplierHandler = ({ productSupplierRepository }: IDeleteProductSupplierDependencies) => {
    return async (event: IDeleteProductSupplierEvent) => {

        const id = event.pathParameters?.id

        if (!id) throw new createError.BadRequest("ProductSupplier ID is required");

        try {
            const productSupplier = await productSupplierRepository.deleteProductSupplier(id);

            return apiResponse({
                statusCode: 200,
                payload: { productSupplier },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("ProductSupplier not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product supplier");
        }
    }
}

