import { adminApiClient } from "@/lib/http/client"
import type { CustomerVisitResponse } from "@/features/admin/customers/api/types"

export async function deleteCustomerVisit(customerId: string, visitId: string) {
    const res = await adminApiClient.delete<CustomerVisitResponse>(`/customers/${customerId}/visits/${visitId}`)
    return res.data.payload.visit
}
