import createError, { HttpError } from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IGetSupplierDependencies, IGetSupplierEvent } from "@/functions/AdminApi/types/suppliers"

export const getSupplierHandler = ({ supplierRepository }: IGetSupplierDependencies) => {
    return async (event: IGetSupplierEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("Supplier id is required");

        try {
            const supplier = await supplierRepository.getSupplier(id);

            if (!supplier) throw new createError.NotFound("Supplier not found");

            return apiResponse({
                statusCode: 200,
                payload: { supplier },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err);
            throw new createError.InternalServerError("Failed to get supplier");
        }
    }
}
