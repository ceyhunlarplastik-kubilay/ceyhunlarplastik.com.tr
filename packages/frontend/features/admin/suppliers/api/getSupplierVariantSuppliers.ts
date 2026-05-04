import { adminApiClient } from "@/lib/http/client"
import type { SupplierVariantSupplierListResponse } from "@/features/admin/suppliers/api/types"

type Params = {
    supplierId: string
    page: number
    limit: number
    search?: string
    categoryId?: string
    productId?: string
    sort?: string
    order?: "asc" | "desc"
}

export async function getSupplierVariantSuppliers(params: Params) {
    const res = await adminApiClient.get<SupplierVariantSupplierListResponse>(
        "/product-variant-suppliers",
        { params }
    )
    return res.data.payload
}
