import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { validateCustomerAttributeSelection } from "@/core/helpers/crm/customerAttributes"
import { ICreateCustomerEvent, ICustomerDependencies } from "@/functions/PublicApi/types/customers"

export const createCustomerHandler = ({
    customerRepository,
    productAttributeValueRepository,
}: ICustomerDependencies) => {
    return async (event: ICreateCustomerEvent) => {
        const {
            companyName,
            fullName,
            phone,
            email,
            note,
            sectorValueId,
            productionGroupValueId,
            usageAreaValueIds,
        } = event.body

        try {
            const { usageAreaIds } = await validateCustomerAttributeSelection(
                productAttributeValueRepository,
                { sectorValueId, productionGroupValueId, usageAreaValueIds },
            )

            const customer = await customerRepository.createCustomer({
                companyName,
                fullName,
                phone,
                email,
                note,
                ...(sectorValueId && { sectorValue: { connect: { id: sectorValueId } } }),
                ...(productionGroupValueId && { productionGroupValue: { connect: { id: productionGroupValueId } } }),
                ...(usageAreaIds.length > 0 && {
                    usageAreaValues: {
                        connect: usageAreaIds.map((id) => ({ id })),
                    },
                }),
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { customer },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error)
            throw new createError.InternalServerError("Failed to create customer")
        }
    }
}
