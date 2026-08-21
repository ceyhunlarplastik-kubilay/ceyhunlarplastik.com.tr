import { adminApiClient } from "@/lib/http/client"
import type { VariantCodeLockResponse } from "@/features/admin/productVariantMatrix/api/types"

export async function setVariantCodeLock(input: {
    productId: string
    locked: boolean
}): Promise<VariantCodeLockResponse["payload"]["product"]> {
    const res = await adminApiClient.post<VariantCodeLockResponse>(
        `/products/${input.productId}/variant-codes/lock`,
        { locked: input.locked }
    )

    return res.data.payload.product
}
