import createError, { HttpError } from "http-errors"

import { deleteLeadCustomers } from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { buildAuditContextFromEvent } from "@/core/helpers/audit/auditContext"
import type {
    IDeleteLeadCustomerEvent,
    IBulkDeleteLeadCustomersEvent,
    ILeadCustomerAddressDependencies,
} from "@/functions/AdminApi/types/leadCustomers"

/**
 * Tek potansiyel müşteriyi siler.
 *
 * Toplu silmeyle AYNI core fonksiyonunu çağırır (`ids` uzunluğu 1): engel
 * listesi, LEAD kilidi ve cascade davranışı tek yerde kalsın. Engellenirse
 * 409 döner — tekil silmede kısmi başarı diye bir şey yok.
 */
export const deleteLeadCustomerHandler = ({ customerRepository }: ILeadCustomerAddressDependencies) => {
    return async (event: IDeleteLeadCustomerEvent) => {
        const audit = buildAuditContextFromEvent(event)

        try {
            const result = await deleteLeadCustomers({
                customerRepository,
                ids: [event.pathParameters.id],
                audit,
            })

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
export const bulkDeleteLeadCustomersHandler = ({ customerRepository }: ILeadCustomerAddressDependencies) => {
    return async (event: IBulkDeleteLeadCustomersEvent) => {
        const audit = buildAuditContextFromEvent(event)

        try {
            const result = await deleteLeadCustomers({
                customerRepository,
                ids: event.body.ids,
                audit,
            })

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
