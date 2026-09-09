import { protectedApiClient } from "@/lib/http/client"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import type { ApiEnvelope } from "@/lib/http/types"

/**
 * Panel ilk-yük pattern'i: /portal/customer'ın hafif hali. assigned ürün AĞACI
 * gelmez (alan undefined kalır), yerine sayısı gelir. "İlgili Ürünler" sayısı
 * profil eşleşmesinden türediği için ayrı uçtan (usePortalFeaturedProducts) alınır.
 */
export type PortalCustomerOverview = AdminCustomer & {
    assignedProductCount?: number
}

type OverviewResponse = ApiEnvelope<{ customer: PortalCustomerOverview }>

export async function getPortalCustomerOverview() {
    const res = await protectedApiClient.get<OverviewResponse>("/portal/customer/overview")
    return res.data.payload.customer
}
