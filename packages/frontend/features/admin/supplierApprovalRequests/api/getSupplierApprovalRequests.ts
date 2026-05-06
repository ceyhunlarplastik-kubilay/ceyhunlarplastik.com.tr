import { adminApiClient } from "@/lib/http/client"
import type { AdminSupplierApprovalRequestListResponse } from "@/features/admin/supplierApprovalRequests/api/types"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    status?: string
    type?: string
    supplierId?: string
}

export async function getSupplierApprovalRequests(params: Params = {}) {
    const res = await adminApiClient.get<AdminSupplierApprovalRequestListResponse>(
        "/supplier-approval-requests",
        { params }
    )

    return res.data.payload
}
