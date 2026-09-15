import { protectedApiClient } from "@/lib/http/client"
import type {
    CustomerVisitResponse,
    CustomerVisitStatus,
    CustomerVisitType,
} from "@/features/admin/customers/api/types"

export type CreateManagedCustomerVisitInput = {
    customerId: string
    ownerUserId: string
    scheduledAt: string
    title: string
    note?: string | null
    status?: CustomerVisitStatus
    type?: CustomerVisitType
}

export async function createManagedCustomerVisit({ customerId, ...body }: CreateManagedCustomerVisitInput) {
    const res = await protectedApiClient.post<CustomerVisitResponse>(
        `/sales/customers/${customerId}/visits`,
        body,
    )
    return res.data.payload.visit
}
