import { adminApiClient } from "@/lib/http/client"
import type { CustomerVisitResponse, CustomerVisitStatus } from "@/features/admin/customers/api/types"

export type UpdateCustomerVisitInput = {
    customerId: string
    visitId: string
    ownerUserId?: string
    scheduledAt?: string
    title?: string
    note?: string | null
    status?: CustomerVisitStatus
    completedAt?: string | null
}

export async function updateCustomerVisit({ customerId, visitId, ...body }: UpdateCustomerVisitInput) {
    const res = await adminApiClient.put<CustomerVisitResponse>(
        `/customers/${customerId}/visits/${visitId}`,
        body,
    )
    return res.data.payload.visit
}
