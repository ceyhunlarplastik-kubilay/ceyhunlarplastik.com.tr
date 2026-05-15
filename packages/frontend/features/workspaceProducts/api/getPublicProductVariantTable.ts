import { publicApiClient } from "@/lib/http/client"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { ApiEnvelope } from "@/lib/http/types"

type PublicProductVariantTableResponse = ApiEnvelope<{
    data: VariantTableData[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}>

export async function getPublicProductVariantTable(productId: string) {
    const res = await publicApiClient.get<PublicProductVariantTableResponse>(
        `/products/${productId}/variant-table`,
        { params: { limit: 500 } },
    )

    return res.data.payload.data ?? []
}
