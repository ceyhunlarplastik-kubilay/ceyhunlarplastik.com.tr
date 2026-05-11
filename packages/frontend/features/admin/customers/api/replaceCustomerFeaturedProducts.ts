import { adminApiClient } from "@/lib/http/client"
import type { CustomerFeaturedProductsResponse } from "@/features/admin/customers/api/types"

export async function replaceCustomerFeaturedProducts(customerId: string, productIds: string[]) {
    const res = await adminApiClient.put<CustomerFeaturedProductsResponse>(
        `/customers/${customerId}/featured-products`,
        { productIds },
    )
    return res.data.payload.data
}
