"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierVariantRequestReferences } from "@/features/supplier/businessRequests/api/getSupplierVariantRequestReferences"

/**
 * `productId` verilirse o ürün modelinin ölçü şablonu da gelir — tedarikçi artık
 * serbest ölçü tipi seçmiyor, hangi ölçüleri gireceğini ürün modeli belirliyor.
 */
export function useSupplierVariantRequestReferences(productId?: string, enabled = true) {
    return useQuery({
        queryKey: ["supplier-variant-request-references", productId ?? null],
        queryFn: () => getSupplierVariantRequestReferences(productId),
        enabled,
        staleTime: 1000 * 60 * 10,
    })
}
