import { adminApiClient } from "@/lib/http/client"
import type { UserListResponse } from "@/features/admin/users/api/types"

type Params = {
    page: number
    limit: number
    search?: string
}

export async function getUsers(params: Params) {
    const res = await adminApiClient.get<UserListResponse>("/users", {
        params,
    })
    return res.data.payload
}
