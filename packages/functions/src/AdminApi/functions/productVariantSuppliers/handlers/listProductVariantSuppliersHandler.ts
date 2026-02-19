import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IListProductVariantSuppliersEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

export const listProductVariantSuppliersHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IListProductVariantSuppliersEvent) => {
        const query = event.queryStringParameters || {};

        const result = await productVariantSupplierRepository.listProductVariantSuppliers(query);

        return apiResponseDTO({
            statusCode: 200,
            payload: result,
        })
    }
}
