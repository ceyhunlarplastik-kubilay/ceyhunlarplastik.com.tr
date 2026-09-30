import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ProductHistory, ProductHistoryQuery } from "@/features/production/stats/api/types"

/** Boş süzgeçler gönderilmez (uç yalnız beyan ettiği alanları kabul eder). */
export async function getProductHistory(query: ProductHistoryQuery): Promise<ProductHistory> {
    const params: Record<string, string> = { productId: query.productId, from: query.from, to: query.to }
    if (query.sizeId) params.sizeId = query.sizeId
    if (query.version) params.version = query.version
    const res = await protectedApiClient.get<ApiEnvelope<ProductHistory>>("/production/stats/products", { params })
    return res.data.payload
}
