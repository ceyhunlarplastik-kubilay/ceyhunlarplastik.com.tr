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
    addresses?: Array<{
        label: string
        contactName?: string | null
        phone?: string | null
        email?: string | null
        country?: string | null
        city: string
        district?: string | null
        line1: string
        line2?: string | null
        postalCode?: string | null
        taxOffice?: string | null
        isPrimary?: boolean
        isBilling?: boolean
        isShipping?: boolean
        note?: string | null
    }>
}

export async function updateCustomer({ id, ...body }: UpdateCustomerInput) {
    const res = await adminApiClient.put<CustomerResponse>(`/customers/${id}`, body)
    return res.data.payload.customer
}
