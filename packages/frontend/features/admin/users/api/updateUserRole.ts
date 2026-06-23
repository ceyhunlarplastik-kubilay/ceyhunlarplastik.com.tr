import { adminApiClient } from "@/lib/http/client"
import type { UserResponse } from "@/features/admin/users/api/types"

type Params = {
    id: string
    group: "owner" | "admin" | "user" | "supplier" | "purchasing" | "sales" | "sales_director" | "customer" | "content_editor"
    accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    supplierId?: string | null
    customerId?: string | null
    reason?: string | null
}

export async function updateUserRole({
    id,
    group,
    accessStatus,
    supplierId,
    customerId,
    reason,
}: Params) {
    const res = await adminApiClient.put<UserResponse>(`/users/${id}/role`, {
        group,
        accessStatus,
        supplierId: supplierId ?? null,
        customerId: customerId ?? null,
        reason: reason ?? null,
    })

    return res.data.payload.user
}
