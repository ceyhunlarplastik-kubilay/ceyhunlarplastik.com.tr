import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapCustomerForApi } from "@/core/helpers/crm/mapCustomerForApi"
import { resolveCustomerAttributeAssignments } from "@/core/helpers/crm/customerAttributes"
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
            attributeValueIds,
            sectorValueId,
            productionGroupValueId,
            usageAreaValueIds,
        } = event.body

        try {
            const resolvedAttributes = await resolveCustomerAttributeAssignments(
                productAttributeValueRepository,
                { attributeValueIds, sectorValueId, productionGroupValueId, usageAreaValueIds },
            )

            const customer = await customerRepository.createCustomer({
                companyName,
                fullName,
                phone,
                email,
                note,
                ...(resolvedAttributes?.sectorValueId && { sectorValue: { connect: { id: resolvedAttributes.sectorValueId } } }),
                ...(resolvedAttributes?.productionGroupValueId && { productionGroupValue: { connect: { id: resolvedAttributes.productionGroupValueId } } }),
                ...(resolvedAttributes && {
                    usageAreaValues: {
                        connect: resolvedAttributes.usageAreaIds.map((id) => ({ id })),
                    },
                    attributeValueAssignments: {
                        create: resolvedAttributes.assignmentValueIds.map((id) => ({
                            source: resolvedAttributes.source,
                            attributeValue: {
                                connect: { id },
                            },
                        })),
                    },
                }),
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { customer: mapCustomerForApi(customer) },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error)
            throw new createError.InternalServerError("Failed to create customer")
        }
    }
}
