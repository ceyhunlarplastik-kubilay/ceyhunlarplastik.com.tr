import { publicServerClient } from "@/lib/http/serverClient"
import type { Product } from "@/features/public/products/types"
import type { ApiEnvelope } from "@/lib/http/types"
import { cache } from "react"
import { unstable_cache } from "next/cache"

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

type FilterParams = Record<string, string | number | string[] | undefined>

function cleanFilterParams(params: FilterParams) {
    return Object.fromEntries(
        Object.entries(params)
            .filter(([, value]) => {
                if (value === undefined) return false
                if (value === "") return false
                if (Array.isArray(value) && value.length === 0) return false
                return true
            })
            .sort(([a], [b]) => a.localeCompare(b))
    ) as Record<string, string | number | string[]>
}

function serializeFilterParams(params: FilterParams) {
    return JSON.stringify(cleanFilterParams(params))
}

function emptyFilteredProductsPayload(limit = 20): FilteredProductsPayload {
    return {
        data: [],
        meta: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
        },
    }
}

async function fetchFilteredProducts(serializedParams: string): Promise<FilteredProductsPayload> {
    const cleanParams = JSON.parse(serializedParams) as Record<string, string | number | string[]>

    try {
        const res = await publicServerClient().get<FilteredProductsResponse>("/products", {
            params: cleanParams,
        })

        return res.data.payload ?? emptyFilteredProductsPayload(Number(cleanParams.limit) || 20)
    } catch (error: any) {
        console.error("getFilteredProducts error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        })
        throw error
    }
}

const getCachedFilteredProducts = unstable_cache(fetchFilteredProducts, ["public-filtered-products-v2"], {
    revalidate: 60,
})

export const getFilteredProducts = cache(async (
    params: FilterParams
): Promise<FilteredProductsPayload> => {
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            if (value === undefined) return false
            if (value === "") return false
            if (Array.isArray(value) && value.length === 0) return false
            return true
        })
    )

    const limit = Number(cleanParams.limit) || 20

    try {
        return await getCachedFilteredProducts(serializeFilterParams(params))
    } catch {
        return emptyFilteredProductsPayload(limit)
    }
})
