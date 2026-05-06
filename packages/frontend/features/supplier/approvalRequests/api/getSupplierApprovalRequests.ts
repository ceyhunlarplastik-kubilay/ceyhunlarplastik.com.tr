import { protectedApiClient } from "@/lib/http/client"
import type { ListSupplierApprovalRequestsResponse } from "@/features/supplier/approvalRequests/api/types"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    status?: string
    type?: string
}

export async function getSupplierApprovalRequests(params: Params = {}) {
    const res = await protectedApiClient.get<ListSupplierApprovalRequestsResponse>(
        "/supplier/approval-requests",
        { params }
    )

    return res.data.payload
}
