import { adminApiClient } from "@/lib/http/client"
import type {
    ProductVariant,
    ProductVariantResponse,
    UpsertVariantInput,
} from "@/features/admin/productVariants/api/types"

export async function createProductVariant(
    payload: UpsertVariantInput
): Promise<ProductVariant> {
    const res = await adminApiClient.post<ProductVariantResponse>(
        "/product-variants",
        payload
    )

    return res.data.payload.productVariant
}
