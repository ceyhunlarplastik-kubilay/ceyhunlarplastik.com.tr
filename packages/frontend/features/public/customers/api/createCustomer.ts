import { publicApiClient } from "@/lib/http/client"
import type { CreateCustomerPayload, CreateCustomerResponse } from "@/features/public/customers/api/types"

export async function createCustomer(payload: CreateCustomerPayload) {
    const res = await publicApiClient.post<CreateCustomerResponse>("/customers", payload)
    return res.data.payload.customer
}
