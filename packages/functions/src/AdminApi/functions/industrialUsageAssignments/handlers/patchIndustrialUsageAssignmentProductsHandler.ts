import createError, { HttpError } from "http-errors"
import { patchIndustrialUsageAssignmentProducts } from "@/core/helpers/products/industrialUsageAssignments"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IPatchIndustrialUsageAssignmentProductsEvent } from "@/functions/AdminApi/types/industrialUsageAssignments"

export const patchIndustrialUsageAssignmentProductsHandler = () => {
    return async (event: IPatchIndustrialUsageAssignmentProductsEvent) => {
        try {
            const payload = await patchIndustrialUsageAssignmentProducts({
                usageAreaValueId: event.pathParameters.usageAreaValueId,
                addProductIds: event.body?.addProductIds ?? [],
                removeProductIds: event.body?.removeProductIds ?? [],
            })

            return apiResponseDTO({
                statusCode: 200,
                payload,
            })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Industrial usage assignment products could not be updated:", error)
            throw new createError.InternalServerError("Kullanım alanı ürün atamaları güncellenemedi")
        }
    }
}
