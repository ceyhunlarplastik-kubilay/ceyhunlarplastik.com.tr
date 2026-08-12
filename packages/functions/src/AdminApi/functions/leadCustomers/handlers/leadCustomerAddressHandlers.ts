import createError, { HttpError } from "http-errors"

import {
    createLeadCustomerAddress,
    deleteLeadCustomerAddress,
    updateLeadCustomerAddress,
} from "@/core/helpers/crm/leadCustomers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreateLeadCustomerAddressEvent,
    IDeleteLeadCustomerAddressEvent,
    ILeadCustomerAddressDependencies,
    IUpdateLeadCustomerAddressEvent,
} from "@/functions/AdminApi/types/leadCustomers"

export const createLeadCustomerAddressHandler = ({
    customerRepository,
}: ILeadCustomerAddressDependencies) => {
    return async (event: ICreateLeadCustomerAddressEvent) => {
        try {
            const customer = await createLeadCustomerAddress({
                customerRepository,
                customerId: event.pathParameters.id,
                body: event.body,
                verifiedByUserId: event.user?.id ?? null,
            })

            return apiResponseDTO({ statusCode: 201, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer address could not be created:", error)
            throw new createError.InternalServerError("Adres eklenemedi")
        }
    }
}

export const updateLeadCustomerAddressHandler = ({
    customerRepository,
}: ILeadCustomerAddressDependencies) => {
    return async (event: IUpdateLeadCustomerAddressEvent) => {
        try {
            const customer = await updateLeadCustomerAddress({
                customerRepository,
                customerId: event.pathParameters.id,
                addressId: event.pathParameters.addressId,
                body: event.body,
                verifiedByUserId: event.user?.id ?? null,
            })

            return apiResponseDTO({ statusCode: 200, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer address could not be updated:", error)
            throw new createError.InternalServerError("Adres güncellenemedi")
        }
    }
}

export const deleteLeadCustomerAddressHandler = ({
    customerRepository,
}: ILeadCustomerAddressDependencies) => {
    return async (event: IDeleteLeadCustomerAddressEvent) => {
        try {
            const customer = await deleteLeadCustomerAddress({
                customerRepository,
                customerId: event.pathParameters.id,
                addressId: event.pathParameters.addressId,
            })

            return apiResponseDTO({ statusCode: 200, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error

            console.error("Lead customer address could not be deleted:", error)
            throw new createError.InternalServerError("Adres silinemedi")
        }
    }
}
