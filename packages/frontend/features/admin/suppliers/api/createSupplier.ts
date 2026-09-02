import { adminApiClient } from "@/lib/http/client"
import type { Supplier } from "@/features/admin/suppliers/api/types"

type Params = {
    name: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
    isActive?: boolean
    assignedPurchasingUserIds?: string[]
}

type SupplierResponse = {
    statusCode: number
    payload: {
        supplier: Supplier
    }
}

export async function createSupplier(payload: Params) {
    const res = await adminApiClient.post<SupplierResponse>("/suppliers", payload)
    return res.data.payload.supplier
}
