import { adminApiClient } from "@/lib/http/client"
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
): Promise<ListProductsResponse["payload"]> {
    const res = await adminApiClient.get<ListProductsResponse>(
        "/products",
        { params }
    )
    return res.data.payload
}
