import { adminApiClient } from "@/lib/http/client"
import type {
    ProductVariant,
    ListProductVariantsTableResponse,
} from "@/features/admin/productVariants/api/types"

type Params = {
    productId: string
}

export async function getProductVariants({
    productId,
}: Params): Promise<ProductVariant[]> {
    const res = await adminApiClient.get<ListProductVariantsTableResponse>(
        "/product-variants/table",
        {
            params: {
                productId,
                limit: 500,
            },
        }
    )

    return res.data.payload.data ?? []
}
