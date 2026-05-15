import { adminApiClient, protectedApiClient } from "@/lib/http/client"
import type {
    BusinessRequestListResponse,
    BusinessRequestListScope,
    ListBusinessRequestsParams,
} from "@/features/businessRequests/api/types"

const scopePathMap: Record<BusinessRequestListScope, string> = {
    portal: "/portal/customer/requests",
    supplier: "/supplier/requests",
    sales: "/sales/approval-requests",
    purchasing: "/purchasing/approval-requests",
    admin: "/approval-requests",
}

export async function listBusinessRequests(
    scope: BusinessRequestListScope,
    params: ListBusinessRequestsParams = {},
) {
    const client = scope === "admin" ? adminApiClient : protectedApiClient
    const res = await client.get<BusinessRequestListResponse>(scopePathMap[scope], {
        params,
    })

    return res.data.payload
}
