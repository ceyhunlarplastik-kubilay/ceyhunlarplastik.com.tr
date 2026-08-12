import createError, { HttpError } from "http-errors"

import { getLeadCustomer } from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetLeadCustomerEvent } from "@/functions/AdminApi/types/leadCustomers"

export const getLeadCustomerHandler = () => {
    return async (event: IGetLeadCustomerEvent) => {
        try {
            const customer = await getLeadCustomer(event.pathParameters.id)

            return apiResponseDTO({ statusCode: 200, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer could not be read:", error)
            throw new createError.InternalServerError("Potansiyel müşteri okunamadı")
        }
    }
}
