import { protectedApiClient } from "@/lib/http/client"
import type { ListSupplierProductsResponse } from "@/features/supplier/variantPrices/api/types"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    categoryId?: string
    supplierId?: string
    endpointPrefix?: "supplier" | "purchasing" | "sales"
}

export async function getSupplierProducts(params: Params = {}) {
    const endpointPrefix = params.endpointPrefix ?? "supplier"
    const res = await protectedApiClient.get<ListSupplierProductsResponse>(
        `/${endpointPrefix}/products`,
        {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                sort: params.sort ?? "name",
                order: params.order ?? "asc",
                ...(params.search ? { search: params.search } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.supplierId ? { supplierId: params.supplierId } : {}),
            },
        }
    )

    return res.data.payload
}

