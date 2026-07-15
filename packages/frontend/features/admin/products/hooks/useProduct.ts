"use client"

import { useQuery } from "@tanstack/react-query"
import { getProduct } from "@/features/admin/products/api/getProduct"

type Options = {
    enabled?: boolean
}

// P1.8(a): Admin ürün listesi "card" view'a indiği için (industrialUsages taşımaz)
// EditProductDialog form default'larını satır-prop'undan dolduramaz; tam ürünü
// (attributeValues + industrialUsages + assets) GET /products/{id} ile ayrıca çeker.
export function useProduct(id: string | undefined, { enabled = true }: Options = {}) {
    return useQuery({
        queryKey: ["admin-product", id],
        queryFn: () => getProduct({ id: id as string }),
        enabled: enabled && Boolean(id),
        staleTime: 0,
        refetchOnWindowFocus: false,
    })
}
