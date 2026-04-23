import { adminApiClient } from "@/lib/http/client"
import type { UserResponse } from "@/features/admin/users/api/types"

type Params = {
    id: string
    supplierId?: string | null
}

export async function updateUserSupplier({ id, supplierId }: Params) {
    const res = await adminApiClient.put<UserResponse>(`/users/${id}/supplier`, {
        supplierId: supplierId ?? null,
    })

    return res.data.payload.user
}
