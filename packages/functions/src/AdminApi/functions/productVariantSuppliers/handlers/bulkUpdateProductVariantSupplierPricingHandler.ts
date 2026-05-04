import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IBulkUpdateProductVariantSupplierPricingEvent,
    IProductVariantSupplierDependencies,
} from "@/functions/AdminApi/types/productVariantSuppliers"

export const bulkUpdateProductVariantSupplierPricingHandler = ({
    productVariantSupplierRepository,
}: IProductVariantSupplierDependencies) => {
    return async (event: IBulkUpdateProductVariantSupplierPricingEvent) => {
        const { productId, supplierId, operationalCostRate, profitRate } = event.body

        try {
            const result = await productVariantSupplierRepository.bulkUpdatePricingByProduct({
                productId,
                supplierId,
                operationalCostRate,
                profitRate,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to bulk update pricing")
        }
    }
}
