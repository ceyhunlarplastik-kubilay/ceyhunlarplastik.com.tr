import { adminApiClient } from "@/lib/http/client"
import type { SupplierProductListResponse } from "@/features/admin/suppliers/api/types"

type Params = {
    supplierId: string
    page: number
    limit: number
    search?: string
    categoryId?: string
    sort?: string
    order?: "asc" | "desc"
}

export async function getSupplierProducts(params: Params) {
    const res = await adminApiClient.get<SupplierProductListResponse>(
        "/product-variant-suppliers/products",
        { params }
    )
    return res.data.payload
}

