import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"

export async function getPortalCustomer() {
    const res = await protectedApiClient.get<CustomerResponse>("/portal/customer")
    return res.data.payload.customer
}
