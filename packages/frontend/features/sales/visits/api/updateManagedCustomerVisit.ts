import { protectedApiClient } from "@/lib/http/client"
import type {
    CustomerVisitOutcome,
    CustomerVisitResponse,
    CustomerVisitStatus,
} from "@/features/admin/customers/api/types"

export type UpdateManagedCustomerVisitInput = {
    customerId: string
    visitId: string
    scheduledAt?: string
    title?: string
    note?: string | null
    status?: CustomerVisitStatus
    outcome?: CustomerVisitOutcome | null
    nextActionAt?: string | null
}

export async function updateManagedCustomerVisit({ customerId, visitId, ...body }: UpdateManagedCustomerVisitInput) {
    const res = await protectedApiClient.put<CustomerVisitResponse>(
        `/sales/customers/${customerId}/visits/${visitId}`,
        body,
    )
    return res.data.payload.visit
}
