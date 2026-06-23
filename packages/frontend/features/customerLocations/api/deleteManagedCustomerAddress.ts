import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"

export async function deleteManagedCustomerAddress(customerId: string, addressId: string) {
    const response = await protectedApiClient.delete<CustomerResponse>(
        `/sales/customers/${customerId}/addresses/${addressId}`,
    )

    return response.data.payload.customer
}
