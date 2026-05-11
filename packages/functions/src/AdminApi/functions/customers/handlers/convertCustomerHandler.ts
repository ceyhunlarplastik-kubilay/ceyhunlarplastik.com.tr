import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
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

        const customer = await customerRepository.convertCustomer(existing.id, requester.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer },
        })
    }
}
