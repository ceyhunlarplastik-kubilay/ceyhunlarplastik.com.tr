import createError, { HttpError } from "http-errors"

import { updateLeadCustomer } from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ILeadCustomerDependencies,
    IUpdateLeadCustomerEvent,
} from "@/functions/AdminApi/types/leadCustomers"

export const updateLeadCustomerHandler = ({
    productAttributeValueRepository,
}: ILeadCustomerDependencies) => {
    return async (event: IUpdateLeadCustomerEvent) => {
        try {
            const customer = await updateLeadCustomer({
                productAttributeValueRepository,
                id: event.pathParameters.id,
                input: event.body,
            })

            return apiResponseDTO({ statusCode: 200, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer could not be updated:", error)
            throw new createError.InternalServerError("Potansiyel müşteri güncellenemedi")
        }
    }
}
