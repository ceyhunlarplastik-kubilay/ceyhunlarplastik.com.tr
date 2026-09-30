import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type {
    OrderCandidates,
    PlanProductionOrderInput,
    PlanProductionOrderResult,
    ProductionOrder,
    ProductionOrderInput,
    ProductionOrderList,
    ProductionOrderListQuery,
    ProductionOrderUpdateInput,
} from "@/features/production/orders/api/types"

export async function listProductionOrders(query: ProductionOrderListQuery): Promise<ProductionOrderList> {
    const res = await protectedApiClient.get<ApiEnvelope<ProductionOrderList>>("/production/orders", {
        params: {
            page: String(query.page),
            limit: String(query.limit),
            status: query.status,
            ...(query.q ? { q: query.q } : {}),
        },
    })
    return res.data.payload
}

export async function createProductionOrder(input: ProductionOrderInput): Promise<ProductionOrder> {
    const res = await protectedApiClient.post<ApiEnvelope<{ order: ProductionOrder }>>("/production/orders", input)
    return res.data.payload.order
}

export async function updateProductionOrder(id: string, input: ProductionOrderUpdateInput): Promise<ProductionOrder> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ order: ProductionOrder }>>(`/production/orders/${id}`, input)
    return res.data.payload.order
}

export async function deleteProductionOrder(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/orders/${id}`)
}

/** "Öner": kalıp × makine plan önizlemesi — hiçbir şey yazmaz. */
export async function getProductionOrderCandidates(id: string): Promise<OrderCandidates> {
    const res = await protectedApiClient.get<ApiEnvelope<OrderCandidates>>(`/production/orders/${id}/candidates`)
    return res.data.payload
}

/**
 * "Planla": emri bir makinede işe çevirir; plan sunucuda yeniden hesaplanır. Kalıp verilmezse
 * o makinede en erken biten kalıp seçilir (tahtaya emir sürükleme); `startAt` en erken başlangıç.
 */
export async function planProductionOrder(id: string, input: PlanProductionOrderInput): Promise<PlanProductionOrderResult> {
    const res = await protectedApiClient.post<ApiEnvelope<PlanProductionOrderResult>>(`/production/orders/${id}/jobs`, input)
    return res.data.payload
}

/** Planlı (sahaya verilmemiş) işi iptal eder. */
export async function deleteProductionJob(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/jobs/${id}`)
}
