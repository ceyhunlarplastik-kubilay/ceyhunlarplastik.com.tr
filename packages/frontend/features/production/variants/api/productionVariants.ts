import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type {
    ProductionVariant,
    ProductionVariantList,
    ProductionVariantListQuery,
} from "@/features/production/variants/api/types"

export async function listProductionVariants(query: ProductionVariantListQuery): Promise<ProductionVariantList> {
    const res = await protectedApiClient.get<ApiEnvelope<ProductionVariantList>>("/production/variants", {
        params: {
            page: String(query.page),
            limit: String(query.limit),
            ...(query.q ? { q: query.q } : {}),
        },
    })
    return res.data.payload
}

/** `cycleTimeSec: null` varyant çevrimini kaldırır (plan kalıp / makine kartına döner). */
export async function setProductionVariantCycle(variantId: string, cycleTimeSec: number | null): Promise<ProductionVariant> {
    const res = await protectedApiClient.put<ApiEnvelope<{ variant: ProductionVariant }>>(
        `/production/variants/${variantId}/profile`,
        { cycleTimeSec },
    )
    return res.data.payload.variant
}
