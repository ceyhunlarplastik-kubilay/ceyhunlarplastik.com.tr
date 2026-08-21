import { adminApiClient } from "@/lib/http/client"
import type { RenumberVariantCodesResponse } from "@/features/admin/productVariantMatrix/api/types"

/** YIKICI: kilidi yok sayar ve tüm ölçü/versiyon kodlarını baştan verir. */
export async function renumberVariantCodes(productId: string) {
    const res = await adminApiClient.post<RenumberVariantCodesResponse>(
        `/products/${productId}/variant-codes/renumber`,
        { confirm: true }
    )

    return res.data.payload.result
}
