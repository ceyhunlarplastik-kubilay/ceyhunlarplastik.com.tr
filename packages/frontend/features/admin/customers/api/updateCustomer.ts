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
    generalDiscountPercent?: number | null
    defaultPaymentTermDays?: number | null
    creditLimit?: number | null
    paymentTermNote?: string | null
    assignedSalesUserId?: string | null
    attributeValueIds?: string[]
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
    companyContactAssignments?: Array<{
        companyContactId: string
        isActive?: boolean
        displayOrder?: number
        note?: string | null
    }>
    addresses?: Array<{
        label: string
        contactName?: string | null
        phone?: string | null
        email?: string | null
        countryId?: number | null
        stateId?: number | null
        cityId?: number | null
        country?: string | null
        city: string
        district?: string | null
        line1: string
        line2?: string | null
        postalCode?: string | null
        taxOffice?: string | null
        taxNumber?: string | null
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
