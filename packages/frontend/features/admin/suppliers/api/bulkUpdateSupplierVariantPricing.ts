import { adminApiClient } from "@/lib/http/client"

type Params = {
    productId: string
    supplierId?: string
    operationalCostRate?: number
    profitRate?: number
}

type Response = {
    statusCode: number
    payload: {
        count: number
    }
}

export async function bulkUpdateSupplierVariantPricing(payload: Params) {
    const res = await adminApiClient.put<Response>(
        "/product-variant-suppliers/bulk-pricing-update",
        payload
    )
    return res.data.payload
}
