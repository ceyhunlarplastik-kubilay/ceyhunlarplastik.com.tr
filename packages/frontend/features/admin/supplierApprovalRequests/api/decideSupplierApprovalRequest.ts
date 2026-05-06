import { adminApiClient } from "@/lib/http/client"
import type { DecideSupplierApprovalRequestResponse } from "@/features/admin/supplierApprovalRequests/api/types"

type Params = {
    id: string
    approved: boolean
    note?: string
}

export async function decideSupplierApprovalRequest({ id, ...payload }: Params) {
    const res = await adminApiClient.post<DecideSupplierApprovalRequestResponse>(
        `/supplier-approval-requests/${id}/decision`,
        payload
    )

    return res.data.payload
}
