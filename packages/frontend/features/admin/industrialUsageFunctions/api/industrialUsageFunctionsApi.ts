import { adminApiClient } from "@/lib/http/client"
import type {
    ApplyIndustrialUsageFunctionsBody,
    ApplyIndustrialUsageFunctionsResponse,
    IndustrialUsageFunctionsResponse,
} from "./types"

export const industrialUsageFunctionKeys = {
    all: ["industrial-usage-functions"] as const,
    byProduct: (productId: string) =>
        [...industrialUsageFunctionKeys.all, productId] as const,
}

export async function getProductIndustrialUsageFunctions(productId: string) {
    const res = await adminApiClient.get<IndustrialUsageFunctionsResponse>(
        `/products/${productId}/industrial-usage-functions`,
    )

    return res.data.payload
}

export async function applyProductIndustrialUsageFunctions(
    productId: string,
    body: ApplyIndustrialUsageFunctionsBody,
) {
    const res = await adminApiClient.put<ApplyIndustrialUsageFunctionsResponse>(
        `/products/${productId}/industrial-usage-functions`,
        body,
    )

    return res.data.payload
}
