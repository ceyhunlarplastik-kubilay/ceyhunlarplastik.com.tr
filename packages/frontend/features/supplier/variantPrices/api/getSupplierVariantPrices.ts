import { protectedApiClient } from "@/lib/http/client"
import type {
    GetSupplierVariantPricesParams,
    ListSupplierVariantPricesResponse,
} from "@/features/supplier/variantPrices/api/types"

export async function getSupplierVariantPrices(params: GetSupplierVariantPricesParams = {}) {
    const endpointPrefix = params.endpointPrefix ?? "supplier"
    const res = await protectedApiClient.get<ListSupplierVariantPricesResponse>(
        `/${endpointPrefix}/variant-prices`,
        {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                sort: params.sort ?? "updatedAt",
                order: params.order ?? "desc",
                ...(params.search ? { search: params.search } : {}),
                ...(params.variantId ? { variantId: params.variantId } : {}),
                ...(params.productId ? { productId: params.productId } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.supplierId ? { supplierId: params.supplierId } : {}),
            },
        }
    )

    return res.data.payload
}
