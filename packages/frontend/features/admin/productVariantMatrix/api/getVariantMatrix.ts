import { adminApiClient } from "@/lib/http/client"
import type { VariantMatrix, VariantMatrixResponse } from "@/features/admin/productVariantMatrix/api/types"

export async function getVariantMatrix(productId: string): Promise<VariantMatrix> {
    const res = await adminApiClient.get<VariantMatrixResponse>(
        `/products/${productId}/variant-matrix`
    )

    return res.data.payload.matrix
}
