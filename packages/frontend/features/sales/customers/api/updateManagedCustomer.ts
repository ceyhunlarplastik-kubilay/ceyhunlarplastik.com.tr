import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"
import type { UpdateCustomerInput } from "@/features/admin/customers/api/updateCustomer"

export async function updateManagedCustomer({ id, ...body }: UpdateCustomerInput) {
    const res = await protectedApiClient.put<CustomerResponse>(`/sales/customers/${id}`, body)
    return res.data.payload.customer
}
