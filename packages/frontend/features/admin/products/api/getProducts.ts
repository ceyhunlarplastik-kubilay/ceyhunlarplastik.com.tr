import { adminApiClient } from "@/lib/http/client"
import type { Product } from "@/features/public/products/types"
import type { ListProductsResponse } from "./types"

export type GetProductsParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    categoryId?: string
}

export async function getProducts(
    params?: GetProductsParams
): Promise<Product[]> {
    const res = await adminApiClient.get<ListProductsResponse>(
        "/products",
        { params }
    )
    return res.data.payload.data ?? []
}
