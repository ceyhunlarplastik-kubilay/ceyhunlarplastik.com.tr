import { adminApiClient } from "@/lib/http/client"
import type { UserResponse } from "@/features/admin/users/api/types"

type Params = {
    id: string
    supplierId?: string | null
    customerId?: string | null
    assignedSupplierIds?: string[]
    assignedCustomerIds?: string[]
}

export async function updateUserSupplier({
    id,
    supplierId,
    customerId,
    assignedSupplierIds,
    assignedCustomerIds,
}: Params) {
    const res = await adminApiClient.put<UserResponse>(`/users/${id}/assignment`, {
        supplierId: supplierId ?? null,
        customerId: customerId ?? null,
        assignedSupplierIds,
        assignedCustomerIds,
    })

    return res.data.payload.user
}
