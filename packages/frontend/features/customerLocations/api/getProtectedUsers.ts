import { protectedApiClient } from "@/lib/http/client"
import type { UserListResponse } from "@/features/admin/users/api/types"

type Params = {
    page: number
    limit: number
    search?: string
    accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
}

export async function getProtectedUsers(params: Params) {
    const response = await protectedApiClient.get<UserListResponse>("/users", { params })
    return response.data.payload
}

