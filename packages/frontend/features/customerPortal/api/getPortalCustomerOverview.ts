import { protectedApiClient } from "@/lib/http/client"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import type { ApiEnvelope } from "@/lib/http/types"

/**
 * Panel ilk-yük pattern'i: /portal/customer'ın hafif hali. featured/assigned
 * ürün AĞAÇLARI gelmez (alanlar undefined kalır), yerine sayılar gelir.
 */
export type PortalCustomerOverview = AdminCustomer & {
    featuredProductCount?: number
    assignedProductCount?: number
}

type OverviewResponse = ApiEnvelope<{ customer: PortalCustomerOverview }>

export async function getPortalCustomerOverview() {
    const res = await protectedApiClient.get<OverviewResponse>("/portal/customer/overview")
    return res.data.payload.customer
}
