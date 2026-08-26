import createError, { HttpError } from "http-errors"

import { deleteLeadCustomers } from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IDeleteLeadCustomerEvent,
    IBulkDeleteLeadCustomersEvent,
} from "@/functions/AdminApi/types/leadCustomers"

/**
 * Tek potansiyel müşteriyi siler.
 *
 * Toplu silmeyle AYNI core fonksiyonunu çağırır (`ids` uzunluğu 1): engel
 * listesi, LEAD kilidi ve cascade davranışı tek yerde kalsın. Engellenirse
 * 409 döner — tekil silmede kısmi başarı diye bir şey yok.
 */
export const deleteLeadCustomerHandler = () => {
    return async (event: IDeleteLeadCustomerEvent) => {
        try {
            const result = await deleteLeadCustomers([event.pathParameters.id])

            if (result.blocked.length > 0) {
                const blocker = result.blocked[0]
                throw new createError.Conflict(
                    `${blocker.name} silinemez — ${blocker.reason}.`,
                )
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: { deletedIds: result.deletedIds, blocked: [] },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer could not be deleted:", error)
            throw new createError.InternalServerError("Potansiyel müşteri silinemedi")
        }
    }
}

/**
 * Birden çok potansiyel müşteriyi siler.
 *
 * Engelli kayıt işlemi DÜŞÜRMEZ: silinebilenler silinir, engelliler adı ve
 * sebebiyle döner ve arayüzde seçili kalır (varyant toplu silmesiyle aynı karar).
 */
export const bulkDeleteLeadCustomersHandler = () => {
    return async (event: IBulkDeleteLeadCustomersEvent) => {
        try {
            const result = await deleteLeadCustomers(event.body.ids)

            return apiResponseDTO({
                statusCode: 200,
                payload: { deletedIds: result.deletedIds, blocked: result.blocked },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customers could not be deleted:", error)
            throw new createError.InternalServerError("Potansiyel müşteriler silinemedi")
        }
    }
}
