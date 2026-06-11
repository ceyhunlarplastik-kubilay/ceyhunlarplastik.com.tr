import { protectedApiClient } from "@/lib/http/client"
import type { CustomerVariantSpecialPriceListResponse } from "@/features/admin/customers/api/types"

export async function getPortalSpecialPrices() {
    const res = await protectedApiClient.get<CustomerVariantSpecialPriceListResponse>("/portal/customer/special-prices")
    return res.data.payload
}
