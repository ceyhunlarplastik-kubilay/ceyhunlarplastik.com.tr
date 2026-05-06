import { protectedApiClient } from "@/lib/http/client"
import type { SupplierProfileResponse } from "@/features/supplier/variantPrices/api/types"
import type { SupplierApprovalRequest, SupplierApprovalRequestResponse } from "@/features/supplier/approvalRequests/api/types"

type Params = {
    name?: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
}

export async function updateSupplierProfile(payload: Params): Promise<SupplierApprovalRequest | null> {
    const res = await protectedApiClient.put<SupplierApprovalRequestResponse | SupplierProfileResponse>("/supplier/profile", payload)

    if ("approvalRequest" in res.data.payload) {
        return (res.data as SupplierApprovalRequestResponse).payload.approvalRequest
    }

    return null
}
