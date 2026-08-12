import createError, { HttpError } from "http-errors"

import { applyProductIndustrialUsageFunctions } from "@/core/helpers/products/industrialUsageFunctions"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IApplyProductIndustrialUsageFunctionsEvent } from "@/functions/AdminApi/types/industrialUsageFunctions"

export const applyProductIndustrialUsageFunctionsHandler = () => {
    return async (event: IApplyProductIndustrialUsageFunctionsEvent) => {
        try {
            const payload = await applyProductIndustrialUsageFunctions({
                productId: event.pathParameters.id,
                rows: event.body.rows,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload,
            })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Product industrial usage functions could not be imported:", error)
            throw new createError.InternalServerError("Kullanım fonksiyonları içe aktarılamadı")
        }
    }
}
