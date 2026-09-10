"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalProductVariantsByMeasurement } from "@/features/customerPortal/api/getPortalProductVariantsByMeasurement"

/**
 * `ProductVariantTable`'ın "Mevcut Varyant Kodları" paneli yalnız KOD/renk/hammadde
 * id'si taşıyan hafif veriyle çalışır (bkz. `GroupedVariantRow` yorumu) — fiyat
 * yok. Portal bağlamında (`portalCartContext` sağlandığında) kompakt aksiyon
 * butonları için seçili ölçünün fiyatlı varyantları burada ayrıca çekilir.
 */
export function usePortalProductVariantsByMeasurement(
    productId: string,
    measurementKey: string,
    enabled: boolean,
) {
    return useQuery({
        queryKey: ["portal-product-variants-by-measurement", productId, measurementKey],
        queryFn: () => getPortalProductVariantsByMeasurement(productId, measurementKey),
        enabled: enabled && Boolean(productId) && Boolean(measurementKey),
    })
}
