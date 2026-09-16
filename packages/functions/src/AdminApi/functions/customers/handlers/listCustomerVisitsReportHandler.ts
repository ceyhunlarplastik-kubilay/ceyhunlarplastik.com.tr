import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IListCustomerVisitsReportEvent } from "@/functions/AdminApi/types/customers"

export const listCustomerVisitsReportHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IListCustomerVisitsReportEvent) => {
        const query = event.queryStringParameters ?? {}
        const stateId = query.stateId ? Number(query.stateId) : undefined
        const cityId = query.cityId ? Number(query.cityId) : undefined
        const scheduledFrom = query.scheduledFrom ? new Date(`${query.scheduledFrom}T00:00:00.000Z`) : undefined
        const scheduledTo = query.scheduledTo ? new Date(`${query.scheduledTo}T23:59:59.999Z`) : undefined
        const normalizedStateId = Number.isFinite(stateId) ? stateId : undefined
        const normalizedCityId = Number.isFinite(cityId) ? cityId : undefined

        // Grafikler (statusCounts/outcomeCounts) BİLEREK `status`/`outcome`
        // filtresini almaz — bkz. `getVisitsReportSummary` yorumu. Diğer tüm
        // filtreler (temsilci/müşteri durumu/tür/tarih/il-ilçe) aynen geçer.
        const [result, summary] = await Promise.all([
            customerRepository.listVisitsForReport({
                page: query.page ? Number(query.page) : undefined,
                limit: query.limit ? Number(query.limit) : undefined,
                ownerUserId: query.ownerUserId,
                customerStatus: query.customerStatus,
                status: query.status,
                type: query.type,
                outcome: query.outcome,
                scheduledFrom,
                scheduledTo,
                stateId: normalizedStateId,
                cityId: normalizedCityId,
            }),
            customerRepository.getVisitsReportSummary({
                ownerUserId: query.ownerUserId,
                customerStatus: query.customerStatus,
                type: query.type,
                scheduledFrom,
                scheduledTo,
                stateId: normalizedStateId,
                cityId: normalizedCityId,
            }),
        ])

        return apiResponseDTO({
            statusCode: 200,
            payload: { ...result, summary },
        })
    }
}
