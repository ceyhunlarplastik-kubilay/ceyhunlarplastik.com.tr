import { adminApiClient } from "@/lib/http/client"
import type { CustomerAssignedProductsResponse } from "@/features/admin/customers/api/types"

export async function getCustomerAssignedProducts(customerId: string) {
    const res = await adminApiClient.get<CustomerAssignedProductsResponse>(`/customers/${customerId}/assigned-products`)
    return res.data.payload.data
}
