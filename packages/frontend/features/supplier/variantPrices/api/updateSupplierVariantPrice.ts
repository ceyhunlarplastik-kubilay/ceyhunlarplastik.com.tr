import { protectedApiClient } from "@/lib/http/client"
import type {
    SupplierVariantPrice,
    SupplierVariantPriceResponse,
} from "@/features/supplier/variantPrices/api/types"
import type { SupplierApprovalRequest, SupplierApprovalRequestResponse } from "@/features/supplier/approvalRequests/api/types"

type Params = {
    id: string
    price: number
    profitRate?: number
    listPrice?: number
    minOrderQty?: number
    stockQty?: number
    currency?: string
    endpointPrefix?: "supplier" | "purchasing"
}

export async function updateSupplierVariantPrice({
    id,
    endpointPrefix = "supplier",
    ...payload
}: Params): Promise<SupplierVariantPrice | SupplierApprovalRequest> {
    const res = await protectedApiClient.put<SupplierVariantPriceResponse | SupplierApprovalRequestResponse>(
        `/${endpointPrefix}/variant-prices/${id}`,
        payload
    )

    if (endpointPrefix === "supplier") {
        return (res.data as SupplierApprovalRequestResponse).payload.approvalRequest
    }

    return (res.data as SupplierVariantPriceResponse).payload.productVariantSupplier
}
