import { adminApiClient } from "@/lib/http/client"
import type {
    ProductVariant,
    ProductVariantResponse,
    UpsertVariantInput,
} from "@/features/admin/productVariants/api/types"

type Params = UpsertVariantInput & {
    id: string
}

export async function updateProductVariant({
    id,
    ...payload
}: Params): Promise<ProductVariant> {
    const res = await adminApiClient.put<ProductVariantResponse>(
        `/product-variants/${id}`,
        payload
    )

    return res.data.payload.productVariant
}
