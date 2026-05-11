import { protectedApiClient } from "@/lib/http/client"
import type { CustomerFeaturedProductsResponse } from "@/features/admin/customers/api/types"

export async function getPortalFeaturedProducts() {
    const res = await protectedApiClient.get<CustomerFeaturedProductsResponse>("/portal/customer/featured-products")
    return res.data.payload.data
}
