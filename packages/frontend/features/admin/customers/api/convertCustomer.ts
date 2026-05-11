import { adminApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"

export async function convertCustomer(id: string) {
    const res = await adminApiClient.post<CustomerResponse>(`/customers/${id}/convert`)
    return res.data.payload.customer
}
