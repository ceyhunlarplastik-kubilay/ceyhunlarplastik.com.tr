import { adminApiClient } from "@/lib/http/client"
import type {
    CustomerStatus,
    CustomerVisitOutcome,
    CustomerVisitsReportResponse,
    CustomerVisitStatus,
    CustomerVisitType,
} from "@/features/admin/customers/api/types"

export type GetCustomerVisitsReportParams = {
    page: number
    limit: number
    ownerUserId?: string
    customerStatus?: CustomerStatus
    status?: CustomerVisitStatus
    type?: CustomerVisitType
    outcome?: CustomerVisitOutcome
    /** "YYYY-MM-DD" — backend gün başına genişletir. */
    scheduledFrom?: string
    scheduledTo?: string
    stateId?: number
    cityId?: number
}

export async function getCustomerVisitsReport(params: GetCustomerVisitsReportParams) {
    const res = await adminApiClient.get<CustomerVisitsReportResponse>("/customer-visits", { params })
    return res.data.payload
}
