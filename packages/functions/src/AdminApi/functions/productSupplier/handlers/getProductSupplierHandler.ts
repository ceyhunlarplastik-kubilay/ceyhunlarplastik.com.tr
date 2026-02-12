import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IGetProductSupplierDependencies, IGetProductSupplierEvent } from "@/functions/AdminApi/types/productSuppliers"

export const getProductSupplierHandler = ({ productSupplierRepository }: IGetProductSupplierDependencies) => {
    return async (event: IGetProductSupplierEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("ProductSupplier id is required");

        try {
            const productSupplier = await productSupplierRepository.getProductSupplier(id);

            if (!productSupplier) throw new createError.NotFound("ProductSupplier not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { productSupplier },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            console.error(err);
            throw new createError.InternalServerError("Failed to get product supplier");
        }
    }
}

