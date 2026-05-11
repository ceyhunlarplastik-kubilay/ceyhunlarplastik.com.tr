import { adminApiClient } from "@/lib/http/client"
import type { CustomerVisitResponse, CustomerVisitStatus } from "@/features/admin/customers/api/types"

export type CreateCustomerVisitInput = {
    customerId: string
    ownerUserId: string
    scheduledAt: string
    title: string
    note?: string | null
    status?: CustomerVisitStatus
}

export async function createCustomerVisit({ customerId, ...body }: CreateCustomerVisitInput) {
    const res = await adminApiClient.post<CustomerVisitResponse>(`/customers/${customerId}/visits`, body)
    return res.data.payload.visit
}
