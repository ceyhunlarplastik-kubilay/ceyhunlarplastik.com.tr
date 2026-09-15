import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IListCustomerVisitsReportEvent } from "@/functions/AdminApi/types/customers"

export const listCustomerVisitsReportHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IListCustomerVisitsReportEvent) => {
        const query = event.queryStringParameters ?? {}
        const stateId = query.stateId ? Number(query.stateId) : undefined
        const cityId = query.cityId ? Number(query.cityId) : undefined

        const result = await customerRepository.listVisitsForReport({
            page: query.page ? Number(query.page) : undefined,
            limit: query.limit ? Number(query.limit) : undefined,
            ownerUserId: query.ownerUserId,
            status: query.status,
            type: query.type,
            outcome: query.outcome,
            scheduledFrom: query.scheduledFrom ? new Date(`${query.scheduledFrom}T00:00:00.000Z`) : undefined,
            scheduledTo: query.scheduledTo ? new Date(`${query.scheduledTo}T23:59:59.999Z`) : undefined,
            stateId: Number.isFinite(stateId) ? stateId : undefined,
            cityId: Number.isFinite(cityId) ? cityId : undefined,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: result,
        })
    }
}
