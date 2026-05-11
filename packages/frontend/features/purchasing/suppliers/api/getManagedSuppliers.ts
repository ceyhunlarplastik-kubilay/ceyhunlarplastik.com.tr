import { protectedApiClient } from "@/lib/http/client"
import type { SupplierListResponse } from "@/features/admin/suppliers/api/types"

type Params = {
    page: number
    limit: number
    search?: string
}

export async function getManagedSuppliers(params: Params) {
    const res = await protectedApiClient.get<SupplierListResponse>("/purchasing/suppliers", { params })
    return res.data.payload
}
