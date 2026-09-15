import { protectedApiClient } from "@/lib/http/client"
import type { CustomerVisitsReportResponse, CustomerVisitStatus } from "@/features/admin/customers/api/types"

export type GetManagedCustomerVisitsReportParams = {
    page: number
    limit: number
    status?: CustomerVisitStatus
}

export async function getManagedCustomerVisitsReport(params: GetManagedCustomerVisitsReportParams) {
    const res = await protectedApiClient.get<CustomerVisitsReportResponse>("/sales/customer-visits", {
        params,
    })
    return res.data.payload
}
