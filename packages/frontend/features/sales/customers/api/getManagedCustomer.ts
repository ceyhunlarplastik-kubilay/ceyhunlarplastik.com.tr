import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"

export async function getManagedCustomer(id: string) {
    const res = await protectedApiClient.get<CustomerResponse>(`/sales/customers/${id}`)
    return res.data.payload.customer
}
