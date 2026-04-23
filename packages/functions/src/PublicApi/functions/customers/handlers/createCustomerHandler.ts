import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateCustomerEvent, ICustomerDependencies } from "@/functions/PublicApi/types/customers"

const ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

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
            const sectorValue = sectorValueId
                ? await productAttributeValueRepository.getValueById(sectorValueId)
                : null

            if (sectorValue && sectorValue.attribute.code !== ATTRIBUTE_CODES.sector) {
                throw new createError.BadRequest("sectorValueId must reference a sector value")
            }

            const productionGroupValue = productionGroupValueId
                ? await productAttributeValueRepository.getValueById(productionGroupValueId)
                : null

            if (productionGroupValue && productionGroupValue.attribute.code !== ATTRIBUTE_CODES.productionGroup) {
                throw new createError.BadRequest("productionGroupValueId must reference a production_group value")
            }

            if (
                sectorValue &&
                productionGroupValue &&
                productionGroupValue.parentValueId !== sectorValue.id
            ) {
                throw new createError.BadRequest("production_group must belong to selected sector")
            }

            const usageAreaIds = [...new Set((usageAreaValueIds ?? []).filter(Boolean))]
            const usageAreaValues = await Promise.all(
                usageAreaIds.map((id) => productAttributeValueRepository.getValueById(id))
            )

            for (const value of usageAreaValues) {
                if (!value) throw new createError.BadRequest("One or more usage_area values are invalid")
                if (value.attribute.code !== ATTRIBUTE_CODES.usageArea) {
                    throw new createError.BadRequest("usageAreaValueIds must reference usage_area values")
                }

                if (productionGroupValue && value.parentValueId !== productionGroupValue.id) {
                    throw new createError.BadRequest("usage_area must belong to selected production_group")
                }

                if (sectorValue) {
                    const usageSectorId = value.parentValue?.parentValueId
                    if (usageSectorId && usageSectorId !== sectorValue.id) {
                        throw new createError.BadRequest("usage_area must belong to selected sector")
                    }
                }
            }

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
