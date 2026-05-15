import { protectedApiClient } from "@/lib/http/client"
import type { BusinessRequestResponse, PortalBusinessRequestInput } from "@/features/businessRequests/api/types"

export async function createPortalBusinessRequest(input: PortalBusinessRequestInput) {
    const res = await protectedApiClient.post<BusinessRequestResponse>("/portal/customer/requests", input)
    return res.data.payload.request
}
