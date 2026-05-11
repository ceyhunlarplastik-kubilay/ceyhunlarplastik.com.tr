import { protectedApiClient } from "@/lib/http/client"
import type { CustomerListResponse } from "@/features/admin/customers/api/types"

type Params = {
    page: number
    limit: number
    search?: string
    status?: "LEAD" | "CUSTOMER"
}

export async function getManagedCustomers(params: Params) {
    const res = await protectedApiClient.get<CustomerListResponse>("/sales/customers", { params })
    return res.data.payload
}
