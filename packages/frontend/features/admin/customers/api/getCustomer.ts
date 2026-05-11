import { adminApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"

export async function getCustomer(id: string) {
    const res = await adminApiClient.get<CustomerResponse>(`/customers/${id}`)
    return res.data.payload.customer
}
