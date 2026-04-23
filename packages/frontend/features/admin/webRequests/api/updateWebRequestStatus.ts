import { adminApiClient } from "@/lib/http/client"
import type { UpdateWebRequestStatusResponse } from "@/features/admin/webRequests/api/types"

type Params = {
    id: string
    status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED"
}

export async function updateWebRequestStatus({ id, status }: Params) {
    const res = await adminApiClient.put<UpdateWebRequestStatusResponse>(
        `/web-requests/${id}/status`,
        { status }
    )

    return res.data.payload.request
}

