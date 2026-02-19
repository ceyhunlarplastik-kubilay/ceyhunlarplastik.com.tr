import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IGetProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

export const getProductVariantSupplierHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IGetProductVariantSupplierEvent) => {
        const { id } = event.pathParameters;

        const record = await productVariantSupplierRepository.getProductVariantSupplier(id);
        if (!record) throw new createError.NotFound("Record not found");

        return apiResponseDTO({
            statusCode: 200,
            payload: { productVariantSupplier: record },
        })
    }
}
