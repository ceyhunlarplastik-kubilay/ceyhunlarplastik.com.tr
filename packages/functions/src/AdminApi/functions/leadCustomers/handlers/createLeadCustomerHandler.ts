import createError, { HttpError } from "http-errors"

import { createLeadCustomer } from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreateLeadCustomerEvent,
    ILeadCustomerDependencies,
} from "@/functions/AdminApi/types/leadCustomers"

export const createLeadCustomerHandler = ({
    productAttributeValueRepository,
}: ILeadCustomerDependencies) => {
    return async (event: ICreateLeadCustomerEvent) => {
        try {
            const customer = await createLeadCustomer({
                productAttributeValueRepository,
                input: event.body,
            })

            return apiResponseDTO({ statusCode: 201, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer could not be created:", error)
            throw new createError.InternalServerError("Potansiyel müşteri oluşturulamadı")
        }
    }
}
