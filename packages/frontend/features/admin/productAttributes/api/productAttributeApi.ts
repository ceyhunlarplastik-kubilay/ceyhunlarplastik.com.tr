import { adminApiClient } from "@/lib/http/client"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"
import type { SupportedLocale, TargetLocale } from "@core/i18n/locales"

export type UpdateProductAttributeInput = {
    name: string
    code: string
    displayOrder: number
    isCustomerAssignable: boolean
    translations?: Array<{
        locale: SupportedLocale
        name: string
    }>
    removeTranslationLocales?: TargetLocale[]
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
