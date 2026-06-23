import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"

export async function deletePortalCustomerAddress(addressId: string) {
    const response = await protectedApiClient.delete<CustomerResponse>(`/portal/customer/addresses/${addressId}`)
    return response.data.payload.customer
}
