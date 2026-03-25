import { publicApiClient } from "@/lib/http/client"
import type { Product } from "@/features/public/products/types"
import type { ApiEnvelope } from "@/lib/http/types"

export type FilteredProductsPayload = {
    data: Product[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export type FilteredProductsResponse = ApiEnvelope<FilteredProductsPayload>

export async function getFilteredProducts(
    params: Record<string, string | number | string[] | undefined>
): Promise<FilteredProductsPayload> {
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            if (value === undefined) return false
            if (value === "") return false
            if (Array.isArray(value) && value.length === 0) return false
            return true
        })
    )

    const res = await publicApiClient.get<FilteredProductsResponse>("/products", {
        params: cleanParams,
    })

    return (
        res.data.payload ?? {
            data: [],
            meta: {
                page: 1,
                limit: 12,
                total: 0,
                totalPages: 0,
            },
        }
    )
}