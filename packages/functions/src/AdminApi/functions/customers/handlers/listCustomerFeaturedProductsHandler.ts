import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IGetCustomerEvent } from "@/functions/AdminApi/types/customers"

export const listCustomerFeaturedProductsHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IGetCustomerEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)

        if (!customer) {
            throw new createError.NotFound("Customer not found")
        }

        const data = await customerRepository.listFeaturedProducts(customer.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        })
    }
}
