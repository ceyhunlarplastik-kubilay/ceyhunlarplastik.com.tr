import { protectedApiClient } from "@/lib/http/client"
import type {
    SupplierVariantPrice,
    SupplierVariantPriceResponse,
} from "@/features/supplier/variantPrices/api/types"

type Params = {
    id: string
    price: number
    currency?: string
}

export async function updateSupplierVariantPrice({
    id,
    ...payload
}: Params): Promise<SupplierVariantPrice> {
    const res = await protectedApiClient.put<SupplierVariantPriceResponse>(
        `/supplier/variant-prices/${id}`,
        payload
    )

    return res.data.payload.productVariantSupplier
}
