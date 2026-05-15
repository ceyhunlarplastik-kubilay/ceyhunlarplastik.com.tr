import { protectedApiClient } from "@/lib/http/client"
import type {
    SupplierVariantPrice,
    SupplierVariantPriceResponse,
} from "@/features/supplier/variantPrices/api/types"
import type { BusinessRequest, BusinessRequestResponse } from "@/features/businessRequests/api/types"

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
}: Params): Promise<SupplierVariantPrice | BusinessRequest> {
    const res = await protectedApiClient.put<SupplierVariantPriceResponse | BusinessRequestResponse>(
        `/${endpointPrefix}/variant-prices/${id}`,
        payload
    )

    if (endpointPrefix === "supplier") {
        return (res.data as BusinessRequestResponse).payload.request
    }

    return (res.data as SupplierVariantPriceResponse).payload.productVariantSupplier
}
