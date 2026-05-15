import createError, { HttpError } from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const bulkUpdateProductVariantSupplierPricingHandler = ({ productVariantSupplierRepository, }) => {
    return async (event) => {
        const { productId, supplierId, operationalCostRate, profitRate } = event.body;
        try {
            const result = await productVariantSupplierRepository.bulkUpdatePricingByProduct({
                productId,
                supplierId,
                operationalCostRate,
                profitRate,
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            console.error(err);
            throw new createError.InternalServerError("Failed to bulk update pricing");
        }
    };
};
