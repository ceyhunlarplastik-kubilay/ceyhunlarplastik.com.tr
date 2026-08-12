import createError, { HttpError } from "http-errors"

import { getProductIndustrialUsageFunctions } from "@/core/helpers/products/industrialUsageFunctions"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetProductIndustrialUsageFunctionsEvent } from "@/functions/AdminApi/types/industrialUsageFunctions"

export const getProductIndustrialUsageFunctionsHandler = () => {
    return async (event: IGetProductIndustrialUsageFunctionsEvent) => {
        try {
            const payload = await getProductIndustrialUsageFunctions(event.pathParameters.id)

            return apiResponseDTO({
                statusCode: 200,
                payload,
            })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Product industrial usage functions could not be read:", error)
            throw new createError.InternalServerError("Kullanım fonksiyonları okunamadı")
        }
    }
}
