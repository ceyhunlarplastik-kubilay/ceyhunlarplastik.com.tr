import { protectedApiClient } from "@/lib/http/client"
import type { BusinessRequest, BusinessRequestResponse } from "@/features/businessRequests/api/types"

type Params = {
    type: "SUPPLIER_CATEGORY_CREATE" | "SUPPLIER_PRODUCT_CREATE" | "SUPPLIER_VARIANT_CREATE"
    title?: string
    description?: string | null
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT"
    requestedData: Record<string, unknown>
}

export async function createSupplierBusinessRequest(payload: Params): Promise<BusinessRequest> {
    const res = await protectedApiClient.post<BusinessRequestResponse>("/supplier/requests", payload)
    return res.data.payload.request
}
