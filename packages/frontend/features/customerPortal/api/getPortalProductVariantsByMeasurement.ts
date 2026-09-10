import { protectedApiClient } from "@/lib/http/client"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { ApiEnvelope } from "@/lib/http/types"

/**
 * `getCustomerProductVariantsByMeasurement` (server, `/varyantlar` sayfası) ile
 * AYNI ProtectedApi ucu — bu istemci-taraflı sürüm `ProductVariantTable`'ın
 * "Mevcut Varyant Kodları" panelindeki kompakt aksiyon butonları (Sepete
 * Ekle / Özel Fiyat Talep Et / Hızlı Fiyat Al) için fiyat/kampanya verisini
 * çeker. Yeni bir backend ucu YOK, mevcut uç TanStack Query ile sarılıyor.
 */

type Payload = {
    data: VariantTableData[]
    columns: string[]
    customerDiscountPercent: number | null
}
type Response = ApiEnvelope<Payload>

export type PortalVariantsByMeasurementResult = {
    variants: VariantTableData[]
    customerDiscountPercent: number | null
}

export async function getPortalProductVariantsByMeasurement(
    productId: string,
    measurementKey: string,
): Promise<PortalVariantsByMeasurementResult> {
    const res = await protectedApiClient.get<Response>(
        `/portal/customer/products/${productId}/variant-measurements`,
        { params: { m: measurementKey, locale: "tr" } },
    )

    return {
        variants: res.data.payload.data ?? [],
        customerDiscountPercent: res.data.payload.customerDiscountPercent ?? null,
    }
}
