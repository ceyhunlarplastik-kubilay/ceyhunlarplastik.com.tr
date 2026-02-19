import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IDeleteProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

export const deleteProductVariantSupplierHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IDeleteProductVariantSupplierEvent) => {
        const { id } = event.pathParameters;

        const existing = await productVariantSupplierRepository.getProductVariantSupplier(id);
        if (!existing) throw new createError.NotFound("Record not found");

        await productVariantSupplierRepository.deleteProductVariantSupplier(id);

        return apiResponseDTO({
            statusCode: 200,
            payload: { message: "Deleted successfully" },
        })
    }
}
