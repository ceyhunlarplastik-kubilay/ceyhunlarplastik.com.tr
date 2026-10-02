import createError from "http-errors"
import { mapCustomerForApi } from "@/core/helpers/crm/mapCustomerForApi"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { buildAuditContextFromEvent } from "@/core/helpers/audit/auditContext"
import { IConvertCustomerEvent, ICustomerDependencies } from "@/functions/AdminApi/types/customers"

export const convertCustomerHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IConvertCustomerEvent) => {
        const requester = event.user
        if (!requester) {
            throw new createError.Unauthorized("Authentication required")
        }

        const existing = await customerRepository.getCustomer(event.pathParameters.id)
        if (!existing) {
            throw new createError.NotFound("Customer not found")
        }

        const customer = await customerRepository.convertCustomer(existing.id, requester.id, buildAuditContextFromEvent(event))

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(customer) },
        })
    }
}
