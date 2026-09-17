import { protectedApiClient } from "@/lib/http/client"
import type { LeadCustomerDetailResponse } from "@/features/admin/leadCustomers/api/types"

export async function getManagedLeadCustomer(id: string) {
    const res = await protectedApiClient.get<LeadCustomerDetailResponse>(`/sales/lead-customers/${id}`)
    return res.data.payload.customer
}
