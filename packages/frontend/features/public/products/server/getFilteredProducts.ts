import { publicServerClient } from "@/lib/http/serverClient"
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

    try {
        const res = await publicServerClient().get<FilteredProductsResponse>("/products", {
            params: cleanParams,
        })

        return (
            res.data.payload ?? {
                data: [],
                meta: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
            }
        )
    } catch (error: any) {
        console.error("getFilteredProducts error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        })
        return {
            data: [],
            meta: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            },
        }
    }
}
