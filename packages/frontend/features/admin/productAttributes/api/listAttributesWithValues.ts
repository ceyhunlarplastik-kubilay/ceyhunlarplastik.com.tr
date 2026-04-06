import { adminApiClient } from "@/lib/http/client"

export type AttributeValue = {
    id: string
    name: string
    slug: string
    displayOrder?: number
    parentValueId?: string | null
}

export type ProductAttribute = {
    id: string
    code: string
    name: string
    displayOrder: number
    values: AttributeValue[]
}

type Response = {
    statusCode: number
    payload: {
        data: ProductAttribute[]
    }
}

export async function listAttributesWithValues(): Promise<ProductAttribute[]> {
    const res = await adminApiClient.get<Response>(
        "/product-attributes/with-values"
    )

    return res.data.payload.data
}
