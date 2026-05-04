import { adminApiClient } from "@/lib/http/client"
import type { Supplier } from "@/features/admin/suppliers/api/types"

type Params = {
    id: string
    name?: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
    isActive?: boolean
}

type SupplierResponse = {
    statusCode: number
    payload: {
        supplier: Supplier
    }
}

export async function updateSupplier({ id, ...payload }: Params) {
    const res = await adminApiClient.put<SupplierResponse>(`/suppliers/${id}`, payload)
    return res.data.payload.supplier
}
