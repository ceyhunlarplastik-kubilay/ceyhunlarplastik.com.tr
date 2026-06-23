import { protectedApiClient } from "@/lib/http/client"
import type { AdminUser } from "@/features/admin/users/api/types"

type Params = {
    firstName: string
    lastName: string
    identifier: string
    phone: string | null
    customerContactTitle: string | null
    customerContactDepartment: string | null
}

type Response = {
    statusCode: number
    payload: {
        user: AdminUser
    }
}

export async function updateMyProfile(params: Params) {
    const res = await protectedApiClient.put<Response>("/me/profile", params)
    return res.data.payload.user
}
