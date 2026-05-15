import { adminApiClient } from "@/lib/http/client"
import type { UserListResponse } from "@/features/admin/users/api/types"

type Params = {
    page: number
    limit: number
    search?: string
    accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
}

export async function getUsers(params: Params) {
    const res = await adminApiClient.get<UserListResponse>("/users", {
        params,
    })
    return res.data.payload
}
