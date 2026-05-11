import { adminApiClient } from "@/lib/http/client"
import type { CustomerResponse, CustomerStatus } from "@/features/admin/customers/api/types"

export type UpdateCustomerInput = {
    id: string
    companyName?: string | null
    fullName?: string
    phone?: string
    email?: string
    note?: string | null
    status?: CustomerStatus
    assignedSalesUserId?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
}

export async function updateCustomer({ id, ...body }: UpdateCustomerInput) {
    const res = await adminApiClient.put<CustomerResponse>(`/customers/${id}`, body)
    return res.data.payload.customer
}
