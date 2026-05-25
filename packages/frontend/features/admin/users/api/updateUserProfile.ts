import { adminApiClient } from "@/lib/http/client"
import type { UserResponse } from "@/features/admin/users/api/types"

type Params = {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    identifier?: string
    phone?: string | null
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact?: boolean
}

export async function updateUserProfile({
    id,
    firstName,
    lastName,
    email,
    identifier,
    phone,
    customerContactTitle,
    customerContactDepartment,
    isPrimaryCustomerContact,
}: Params) {
    const res = await adminApiClient.put<UserResponse>(`/users/${id}/profile`, {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(identifier !== undefined ? { identifier } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(customerContactTitle !== undefined ? { customerContactTitle } : {}),
        ...(customerContactDepartment !== undefined ? { customerContactDepartment } : {}),
        ...(isPrimaryCustomerContact !== undefined ? { isPrimaryCustomerContact } : {}),
    })

    return res.data.payload.user
}
