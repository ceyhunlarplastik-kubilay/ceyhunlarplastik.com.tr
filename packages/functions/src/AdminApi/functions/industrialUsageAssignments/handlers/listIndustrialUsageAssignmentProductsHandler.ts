import createError, { HttpError } from "http-errors"
import { listIndustrialUsageAssignmentProducts } from "@/core/helpers/products/industrialUsageAssignments"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IListIndustrialUsageAssignmentProductsEvent } from "@/functions/AdminApi/types/industrialUsageAssignments"

function parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const listIndustrialUsageAssignmentProductsHandler = () => {
    return async (event: IListIndustrialUsageAssignmentProductsEvent) => {
        try {
            const query = event.queryStringParameters ?? {}
            const payload = await listIndustrialUsageAssignmentProducts({
                usageAreaValueId: event.pathParameters.usageAreaValueId,
                page: parsePositiveInteger(query.page, 1),
                limit: parsePositiveInteger(query.limit, 20),
                search: query.search,
                assignment: query.assignment ?? "all",
            })

            return apiResponseDTO({
                statusCode: 200,
                payload,
            })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Industrial usage assignment products could not be listed:", error)
            throw new createError.InternalServerError("Kullanım alanı ürün atamaları listelenemedi")
        }
    }
}
