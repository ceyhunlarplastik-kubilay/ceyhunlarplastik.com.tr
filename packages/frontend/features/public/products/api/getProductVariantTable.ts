import { publicApiClient } from "@/lib/http/client"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { ApiEnvelope } from "@/lib/http/types"

type ProductVariantTableResponse = ApiEnvelope<{
    data: VariantTableData[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
        columns?: string[]
    }
}>

export async function getProductVariantTable(
    productId: string,
    options: { locale?: string } = {},
): Promise<VariantTableData[]> {
    const res = await publicApiClient.get<ProductVariantTableResponse>(
        `/products/${productId}/variant-table`,
        {
            params: {
                limit: 500,
                locale: options.locale ?? "tr",
            },
        },
    )

    return res.data.payload.data ?? []
}
