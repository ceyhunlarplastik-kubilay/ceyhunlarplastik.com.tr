"use client"

import { useQuery } from "@tanstack/react-query"
import { getVariantReferences } from "@/features/admin/productVariants/api/getVariantReferences"

export function useVariantReferences() {
    return useQuery({
        queryKey: ["admin-product-variant-references"],
        queryFn: getVariantReferences,
    })
}
