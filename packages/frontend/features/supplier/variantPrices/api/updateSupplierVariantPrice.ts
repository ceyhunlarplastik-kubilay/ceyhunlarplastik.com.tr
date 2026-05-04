import { protectedApiClient } from "@/lib/http/client"
import type {
    SupplierVariantPrice,
    SupplierVariantPriceResponse,
} from "@/features/supplier/variantPrices/api/types"

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
}: Params): Promise<SupplierVariantPrice> {
    const res = await protectedApiClient.put<SupplierVariantPriceResponse>(
        `/${endpointPrefix}/variant-prices/${id}`,
        payload
    )

    return res.data.payload.productVariantSupplier
}
