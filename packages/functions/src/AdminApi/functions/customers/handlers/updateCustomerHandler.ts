import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { buildCustomerUpdateData } from "@/core/helpers/crm/customerUpdateData"
import { ICustomerDependencies, IUpdateCustomerEvent } from "@/functions/AdminApi/types/customers"

export const updateCustomerHandler = ({
    customerRepository,
    productAttributeValueRepository,
}: ICustomerDependencies) => {
    return async (event: IUpdateCustomerEvent) => {
        if (!productAttributeValueRepository) {
            throw new createError.InternalServerError("Product attribute value repository not configured")
        }

        const existing = await customerRepository.getCustomer(event.pathParameters.id)
        if (!existing) {
            throw new createError.NotFound("Customer not found")
        }

        const data = await buildCustomerUpdateData(productAttributeValueRepository, event.body ?? {})
        const customer = await customerRepository.updateCustomer(existing.id, data)

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer },
        })
    }
}
