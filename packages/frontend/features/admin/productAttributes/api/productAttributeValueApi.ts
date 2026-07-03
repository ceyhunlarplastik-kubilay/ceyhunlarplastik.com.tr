import { adminApiClient } from "@/lib/http/client"
import { ATTRIBUTE_VALUE_IMAGE_MAX_SIZE_BYTES } from "@/features/admin/productAttributes/constants"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

export type AttributeWithValues = {
    id: string
    code: string
    name: string
    values: ProductAttributeValue[]
}

export type CreateProductAttributeValueInput = {
    name: string
    attributeId: string
    parentValueId?: string | null
}

export type UpdateProductAttributeValueInput = {
    name?: string
    parentValueId?: string | null
    assetType?: "IMAGE"
    assetRole?: "PRIMARY"
    assetKey?: string
    mimeType?: string
}

type ValuesResponse = {
    statusCode: number
    payload: {
        data: ProductAttributeValue[]
    }
}

type CreateValueResponse = {
    statusCode: number
    payload: {
        value: ProductAttributeValue
    }
}

type PresignResponse = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
    }
}

export function validateAttributeValueImage(file: File) {
    if (!file.type.startsWith("image/")) {
        return "Sadece görsel dosyası yükleyebilirsiniz."
    }

    if (file.size > ATTRIBUTE_VALUE_IMAGE_MAX_SIZE_BYTES) {
        return "Görsel en fazla 3MB olabilir."
    }

    return null
}

export async function listProductAttributeValues(attributeId: string) {
    const response = await adminApiClient.get<ValuesResponse>(
        `/product-attribute-values/${attributeId}`,
    )

    return response.data.payload.data
}

export async function createProductAttributeValue(input: CreateProductAttributeValueInput) {
    const response = await adminApiClient.post<CreateValueResponse>(
        "/product-attribute-values",
        input,
    )

    return response.data.payload.value
}

export async function updateProductAttributeValue(
    valueId: string,
    input: UpdateProductAttributeValueInput,
) {
    await adminApiClient.put(`/product-attribute-values/${valueId}`, input)
}

export async function deleteProductAttributeValue(valueId: string) {
    await adminApiClient.delete(`/product-attribute-values/${valueId}`)
}

export async function deleteProductAttributeValueAsset(assetId: string) {
    await adminApiClient.delete(`/assets/${assetId}`)
}

export async function uploadProductAttributeValuePrimaryImage({
    valueId,
    file,
}: {
    valueId: string
    file: File
}) {
    const validationError = validateAttributeValueImage(file)
    if (validationError) {
        throw new Error(validationError)
    }

    const presignResponse = await adminApiClient.post<PresignResponse>(
        "/product-attribute-values/assets/presign",
        {
            productAttributeValueId: valueId,
            assetRole: "PRIMARY",
            fileName: file.name,
            contentType: file.type || "image/jpeg",
        },
    )

    const { uploadUrl, key } = presignResponse.data.payload

    await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
    })

    await updateProductAttributeValue(valueId, {
        assetType: "IMAGE",
        assetRole: "PRIMARY",
        assetKey: key,
        mimeType: file.type || "image/jpeg",
    })
}
