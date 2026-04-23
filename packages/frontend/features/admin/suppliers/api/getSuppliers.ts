import { adminApiClient } from "@/lib/http/client"
import type { SupplierListResponse } from "@/features/admin/suppliers/api/types"

type Params = {
    page: number
    limit: number
    search?: string
}

export async function getSuppliers(params: Params) {
    const res = await adminApiClient.get<SupplierListResponse>("/suppliers", {
        params,
    })
    return res.data.payload
}
