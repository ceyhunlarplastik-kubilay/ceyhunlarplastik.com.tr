import { adminApiClient } from "@/lib/http/client"
import type { WebRequestListResponse } from "@/features/admin/webRequests/api/types"

type Params = {
    page: number
    limit: number
    search?: string
    status?: string
}

export async function getWebRequests(params: Params) {
    const res = await adminApiClient.get<WebRequestListResponse>("/web-requests", {
        params,
    })

    return res.data.payload
}

