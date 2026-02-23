import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IDeleteProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

export const deleteProductVariantSupplierHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IDeleteProductVariantSupplierEvent) => {
        const { id } = event.pathParameters;

        const existing = await productVariantSupplierRepository.getProductVariantSupplier(id);
        if (!existing) throw new createError.NotFound("Record not found");

        try {
            await productVariantSupplierRepository.deleteProductVariantSupplier(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { message: "Deleted successfully" },
            })
        } catch (err) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound(`Product variant supplier not found`);
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product variant supplier");
        }
    }
}
