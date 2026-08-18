import createError, { HttpError } from "http-errors"

import { createLeadCustomer } from "@/core/helpers/crm/leadCustomers"
import { InvalidWebsiteUrlError } from "@/core/helpers/crm/customerWebsite"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreateLeadCustomerEvent,
    ILeadCustomerDependencies,
} from "@/functions/AdminApi/types/leadCustomers"

export const createLeadCustomerHandler = ({
    productAttributeValueRepository,
    customerRepository,
}: ILeadCustomerDependencies) => {
    return async (event: ICreateLeadCustomerEvent) => {
        // Adres oluşturma gövdesinde OPSİYONEL; profil alanlarından ayrılır ki
        // `createLeadCustomer` girdisi ticari olmayan profil sözleşmesinde kalsın.
        const { address, ...input } = event.body

        try {
            const customer = await createLeadCustomer({
                productAttributeValueRepository,
                customerRepository,
                input,
                address: address ?? null,
                verifiedByUserId: event.user?.id ?? null,
            })

            return apiResponseDTO({ statusCode: 201, payload: { customer } })
        } catch (error) {
            if (error instanceof HttpError) throw error
            // Geçersiz web sitesi kullanıcı hatasıdır, 500 değil 400 dönmeli.
            if (error instanceof InvalidWebsiteUrlError) {
                throw new createError.BadRequest(error.message)
            }

            console.error("Lead customer could not be created:", error)
            throw new createError.InternalServerError("Potansiyel müşteri oluşturulamadı")
        }
    }
}
