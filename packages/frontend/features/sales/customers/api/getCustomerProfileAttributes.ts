import { publicApiClient } from "@/lib/http/client"

export type CustomerProfileAttribute = {
    id: string
    code: string
    name: string
    isCustomerAssignable?: boolean
    values: Array<{
        id: string
        name: string
        parentValueId?: string | null
    }>
}

type Response = {
    statusCode: number
    payload: {
        data: CustomerProfileAttribute[]
    }
}

export async function getCustomerProfileAttributes() {
    const response = await publicApiClient.get<Response>("/product-attributes/with-values")
    return response.data.payload.data
}
