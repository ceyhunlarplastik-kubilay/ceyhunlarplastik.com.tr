"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicProductVariantTable } from "@/features/workspaceProducts/api/getPublicProductVariantTable"

export function usePublicProductVariants(productId: string) {
    return useQuery({
        queryKey: ["workspace-public-product-variants", productId],
        queryFn: () => getPublicProductVariantTable(productId),
        enabled: Boolean(productId),
    })
}
