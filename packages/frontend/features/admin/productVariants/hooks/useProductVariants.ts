"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductVariants } from "@/features/admin/productVariants/api/getProductVariants"

export function useProductVariants(productId: string) {
    return useQuery({
        queryKey: ["admin-product-variants", productId],
        queryFn: () => getProductVariants({ productId }),
        enabled: Boolean(productId),
    })
}
