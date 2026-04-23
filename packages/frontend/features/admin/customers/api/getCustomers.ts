import { adminApiClient } from "@/lib/http/client"
import type { CustomerListResponse } from "@/features/admin/customers/api/types"

type Params = {
    page: number
    limit: number
    search?: string
    sectorValueId?: string
    productionGroupValueId?: string
    usageAreaValueId?: string
}

export async function getCustomers(params: Params) {
    const res = await adminApiClient.get<CustomerListResponse>("/customers", {
        params,
    })

    return res.data.payload
}
