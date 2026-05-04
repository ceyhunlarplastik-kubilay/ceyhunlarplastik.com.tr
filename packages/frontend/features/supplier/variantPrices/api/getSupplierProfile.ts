import { protectedApiClient } from "@/lib/http/client"
import type { SupplierProfileResponse } from "@/features/supplier/variantPrices/api/types"

export async function getSupplierProfile(endpointPrefix: "supplier" | "purchasing" | "sales" = "supplier") {
    const res = await protectedApiClient.get<SupplierProfileResponse>(`/${endpointPrefix}/profile`)
    return res.data.payload.supplier
}

