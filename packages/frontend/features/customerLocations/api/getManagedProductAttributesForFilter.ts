import { protectedApiClient } from "@/lib/http/client"

export type ManagedProductAttributeForFilter = {
    id: string
    code: string
    name: string
    values: { id: string; name: string }[]
}

type Response = {
    statusCode: number
    payload: {
        data: ManagedProductAttributeForFilter[]
    }
}

export async function getManagedProductAttributesForFilter(): Promise<ManagedProductAttributeForFilter[]> {
    const response = await protectedApiClient.get<Response>("/sales/product-attributes/with-values")
    return response.data.payload.data
}
