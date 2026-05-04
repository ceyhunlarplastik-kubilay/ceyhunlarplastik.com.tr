import { protectedApiClient } from "@/lib/http/client"
import type { SupplierProfileResponse } from "@/features/supplier/variantPrices/api/types"

type Params = {
    name?: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
}

export async function updateSupplierProfile(payload: Params) {
    const res = await protectedApiClient.put<SupplierProfileResponse>("/supplier/profile", payload)
    return res.data.payload.supplier
}
