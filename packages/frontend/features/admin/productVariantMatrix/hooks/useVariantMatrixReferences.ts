"use client"

import { useQuery } from "@tanstack/react-query"
import { getVariantMatrixReferences } from "@/features/admin/productVariantMatrix/api/getVariantMatrixReferences"

/**
 * Renk / hammadde / tedarikçi / ölçü tipi seçim listeleri.
 *
 * `/product-variants/references` DEĞİL: o uç `["admin"]` ile kapalı ve tedarikçi
 * künyesinin tamamını döndürüyor. Bu uç veri girişi operatörüne de açık ve dar.
 */
export function useVariantMatrixReferences() {
    return useQuery({
        queryKey: ["admin-variant-matrix-references"],
        queryFn: getVariantMatrixReferences,
        // Sözlükler nadiren değişir; matris her kayıtta invalidate olurken bunlar durur.
        staleTime: 5 * 60 * 1000,
    })
}
