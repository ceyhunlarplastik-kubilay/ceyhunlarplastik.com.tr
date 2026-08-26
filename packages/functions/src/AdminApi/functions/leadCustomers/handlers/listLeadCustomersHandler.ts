import createError, { HttpError } from "http-errors"

import { listLeadCustomers } from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IListLeadCustomersEvent } from "@/functions/AdminApi/types/leadCustomers"

/** Geo id'leri query string'de metindir; geçersizse filtre UYGULANMAZ. */
function parseGeoId(value: string | undefined) {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const listLeadCustomersHandler = () => {
    return async (event: IListLeadCustomersEvent) => {
        try {
            const query = event.queryStringParameters ?? {}

            const payload = await listLeadCustomers({
                page: parsePositiveInteger(query.page, 1),
                limit: parsePositiveInteger(query.limit, 20),
                search: query.search,
                sectorValueId: query.sectorValueId,
                usageAreaValueId: query.usageAreaValueId,
                countryId: parseGeoId(query.countryId),
                stateId: parseGeoId(query.stateId),
                cityId: parseGeoId(query.cityId),
            })

            return apiResponseDTO({ statusCode: 200, payload })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customers could not be listed:", error)
            throw new createError.InternalServerError("Potansiyel müşteriler listelenemedi")
        }
    }
}
