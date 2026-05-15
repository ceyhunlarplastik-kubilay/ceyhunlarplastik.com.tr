import { protectedApiClient } from "@/lib/http/client"
import type { CustomerAssignedProductsResponse } from "@/features/admin/customers/api/types"

export async function getPortalAssignedProducts() {
    const res = await protectedApiClient.get<CustomerAssignedProductsResponse>("/portal/customer/assigned-products")
    return res.data.payload.data
}
