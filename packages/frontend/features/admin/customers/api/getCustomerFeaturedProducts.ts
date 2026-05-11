import { adminApiClient } from "@/lib/http/client"
import type { CustomerFeaturedProductsResponse } from "@/features/admin/customers/api/types"

export async function getCustomerFeaturedProducts(customerId: string) {
    const res = await adminApiClient.get<CustomerFeaturedProductsResponse>(`/customers/${customerId}/featured-products`)
    return res.data.payload.data
}
