"use client"

import { protectedApiClient } from "@/lib/http/client"
import type { CustomerAssignedProductsResponse } from "@/features/admin/customers/api/types"

/**
 * Kalp butonunun uçları. İkisi de güncel favori listesinin TAMAMINI döner;
 * böylece mutation sonrası ayrı bir liste isteği gerekmez.
 */
export async function addPortalFavoriteVariant(productVariantId: string) {
    const res = await protectedApiClient.post<CustomerAssignedProductsResponse>(
        "/portal/customer/favorite-variants",
        { productVariantId },
    )
    return res.data.payload.data
}

export async function removePortalFavoriteVariant(productVariantId: string) {
    const res = await protectedApiClient.delete<CustomerAssignedProductsResponse>(
        `/portal/customer/favorite-variants/${productVariantId}`,
    )
    return res.data.payload.data
}
