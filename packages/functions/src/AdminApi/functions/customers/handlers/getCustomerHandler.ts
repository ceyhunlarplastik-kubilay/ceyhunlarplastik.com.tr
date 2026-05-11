import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IGetCustomerEvent } from "@/functions/AdminApi/types/customers"

export const getCustomerHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IGetCustomerEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)

        if (!customer) {
            throw new createError.NotFound("Customer not found")
        }

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer },
        })
    }
}
