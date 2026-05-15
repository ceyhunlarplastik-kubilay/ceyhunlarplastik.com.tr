import { adminApiClient } from "@/lib/http/client"
import type { CustomerAssignedProductsResponse } from "@/features/admin/customers/api/types"

export async function replaceCustomerAssignedProducts(customerId: string, productIds: string[]) {
    const res = await adminApiClient.put<CustomerAssignedProductsResponse>(
        `/customers/${customerId}/assigned-products`,
        { productIds },
    )
    return res.data.payload.data
}
