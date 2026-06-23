import { adminApiClient } from "@/lib/http/client"
import type { CustomerAssignedProductsResponse } from "@/features/admin/customers/api/types"

export async function replaceCustomerAssignedProducts(customerId: string, productVariantIds: string[]) {
    const res = await adminApiClient.put<CustomerAssignedProductsResponse>(
        `/customers/${customerId}/assigned-products`,
        { productVariantIds },
    )
    return res.data.payload.data
}
