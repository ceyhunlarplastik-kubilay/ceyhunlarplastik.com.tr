import { adminApiClient } from "@/lib/http/client"
import type { CustomerVisitsResponse } from "@/features/admin/customers/api/types"

export async function getCustomerVisits(customerId: string) {
    const res = await adminApiClient.get<CustomerVisitsResponse>(`/customers/${customerId}/visits`)
    return res.data.payload.data
}
