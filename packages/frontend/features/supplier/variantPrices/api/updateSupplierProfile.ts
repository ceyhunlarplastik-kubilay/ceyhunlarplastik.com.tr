import { protectedApiClient } from "@/lib/http/client"
import type { SupplierProfileResponse } from "@/features/supplier/variantPrices/api/types"
import type { BusinessRequest, BusinessRequestResponse } from "@/features/businessRequests/api/types"

type Params = {
    name?: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
}

export async function updateSupplierProfile(payload: Params): Promise<BusinessRequest | null> {
    const res = await protectedApiClient.put<BusinessRequestResponse | SupplierProfileResponse>("/supplier/profile", payload)

    if ("request" in res.data.payload) {
        return (res.data as BusinessRequestResponse).payload.request
    }

    return null
}
