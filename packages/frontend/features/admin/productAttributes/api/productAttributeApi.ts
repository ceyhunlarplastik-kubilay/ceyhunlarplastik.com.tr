import { adminApiClient } from "@/lib/http/client"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"

export type UpdateProductAttributeInput = {
    name: string
    code: string
    displayOrder: number
    isCustomerAssignable: boolean
    translations?: Array<{
        locale: "en"
        name: string
    }>
    removeTranslationLocales?: "en"[]
}

type UpdateProductAttributeResponse = {
    statusCode: number
    payload: {
        attribute: ProductAttribute
    }
}

export async function updateProductAttribute(
    attributeId: string,
    input: UpdateProductAttributeInput,
) {
    const response = await adminApiClient.put<UpdateProductAttributeResponse>(
        `/product-attributes/${attributeId}`,
        input,
    )

    return response.data.payload.attribute
}
