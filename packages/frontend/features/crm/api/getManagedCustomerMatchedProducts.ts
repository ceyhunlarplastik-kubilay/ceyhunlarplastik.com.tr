import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { CustomerProfileMatchedProductsResult } from "@/features/crm/types"

type Response = ApiEnvelope<{ data: CustomerProfileMatchedProductsResult }>

/**
 * Satış paneli — atanmış müşterinin profiliyle eşleşen ürünler. Erişim
 * backend'de `assertCustomerManagementAccess` ile kısıtlıdır: satış temsilcisi
 * yalnız kendi sorumluluğundaki müşteriyi sorgulayabilir.
 */
export async function getManagedCustomerMatchedProducts(
    customerId: string,
): Promise<CustomerProfileMatchedProductsResult> {
    const res = await protectedApiClient.get<Response>(`/sales/customers/${customerId}/matched-products`)
    return res.data.payload.data
}
