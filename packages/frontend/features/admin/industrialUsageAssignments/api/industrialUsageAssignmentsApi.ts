import { adminApiClient } from "@/lib/http/client"
import type {
    ListIndustrialUsageAssignmentProductsParams,
    ListIndustrialUsageAssignmentProductsResponse,
    PatchIndustrialUsageAssignmentProductsBody,
    PatchIndustrialUsageAssignmentProductsResponse,
} from "./types"

export const industrialUsageAssignmentKeys = {
    all: ["industrial-usage-assignments"] as const,
    products: (
        usageAreaValueId: string,
        params: ListIndustrialUsageAssignmentProductsParams,
    ) => [
        ...industrialUsageAssignmentKeys.all,
        "products",
        usageAreaValueId,
        params,
    ] as const,
}

export async function listIndustrialUsageAssignmentProducts(
    usageAreaValueId: string,
    params: ListIndustrialUsageAssignmentProductsParams,
) {
    const res = await adminApiClient.get<ListIndustrialUsageAssignmentProductsResponse>(
        `/industrial-usage-assignments/${usageAreaValueId}/products`,
        { params },
    )

    return res.data.payload
}

export async function patchIndustrialUsageAssignmentProducts(
    usageAreaValueId: string,
    body: PatchIndustrialUsageAssignmentProductsBody,
) {
    const res = await adminApiClient.patch<PatchIndustrialUsageAssignmentProductsResponse>(
        `/industrial-usage-assignments/${usageAreaValueId}/products`,
        body,
    )

    return res.data.payload
}
