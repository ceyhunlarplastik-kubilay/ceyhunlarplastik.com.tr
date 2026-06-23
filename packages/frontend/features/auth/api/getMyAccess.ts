import { protectedApiClient } from "@/lib/http/client"
import type { AdminUser } from "@/features/admin/users/api/types"

export type MyAccessResponse = {
    statusCode: number
    payload: {
        user: AdminUser
        canAccessPanels: boolean
    }
}

export async function getMyAccess() {
    const res = await protectedApiClient.get<MyAccessResponse>("/me/access")
    return res.data.payload
}
