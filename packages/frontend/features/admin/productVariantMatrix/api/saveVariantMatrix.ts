import { adminApiClient } from "@/lib/http/client"
import type {
    SaveVariantMatrixResponse,
    SaveVariantMatrixResult,
    SaveVariantMatrixRowInput,
} from "@/features/admin/productVariantMatrix/api/types"

export async function saveVariantMatrix(input: {
    productId: string
    rows: SaveVariantMatrixRowInput[]
}): Promise<SaveVariantMatrixResult> {
    const res = await adminApiClient.put<SaveVariantMatrixResponse>(
        `/products/${input.productId}/variant-matrix`,
        { rows: input.rows }
    )

    return res.data.payload.result
}
