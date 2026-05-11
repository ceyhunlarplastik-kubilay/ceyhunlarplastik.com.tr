import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IListCustomerVisitsEvent } from "@/functions/AdminApi/types/customers"

export const listCustomerVisitsHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IListCustomerVisitsEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)

        if (!customer) {
            throw new createError.NotFound("Customer not found")
        }

        const data = await customerRepository.listVisits(customer.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        })
    }
}
