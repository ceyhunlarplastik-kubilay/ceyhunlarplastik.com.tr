import createError from "http-errors"
import { mapCustomerAssignedProductForApi } from "@/core/helpers/crm/mapCustomerForApi"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IReplaceCustomerAssignedProductsEvent } from "@/functions/AdminApi/types/customers"

export const replaceCustomerAssignedProductsHandler = ({
    customerRepository,
    productVariantRepository,
}: ICustomerDependencies) => {
    return async (event: IReplaceCustomerAssignedProductsEvent) => {
        if (!productVariantRepository) {
            throw new createError.InternalServerError("Product variant repository not configured")
        }

        const requester = event.user
        if (!requester) {
            throw new createError.Unauthorized("Authentication required")
        }

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) {
            throw new createError.NotFound("Customer not found")
        }

        const productVariantIds = Array.from(new Set((event.body?.productVariantIds ?? []).filter(Boolean)))

        await Promise.all(
            productVariantIds.map(async (productVariantId) => {
                const productVariant = await productVariantRepository.getProductVariant(productVariantId)
                if (!productVariant) {
                    throw new createError.NotFound("Product variant not found")
                }
            }),
        )

        const data = await customerRepository.replaceAssignedProducts(customer.id, productVariantIds, requester.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: data.map(mapCustomerAssignedProductForApi),
            },
        })
    }
}
