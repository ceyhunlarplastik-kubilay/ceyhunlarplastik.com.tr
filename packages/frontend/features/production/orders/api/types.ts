import type {
    ProductionOrderSource,
    ProductionOrderStatus,
} from "@core/helpers/production/productionOrders"
import type { ReferenceMoldSummary, ReferenceVariantVersion } from "@/features/production/references/api/types"

export type ProductionPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"
export type { ProductionOrderSource, ProductionOrderStatus }

export type ProductionJobStatus = "PLANNED" | "RELEASED" | "SETUP" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED"

export type ProductionOrderJob = {
    id: string
    lotBaseNumber: number
    status: ProductionJobStatus
    machine: { id: string; code: string; name: string }
    mold: { id: string; code: string; name: string }
    setupStartAt: string
    plannedEndAt: string
    plannedQuantity: number
    lots: Array<{
        lotNumber: string
        sequence: number
        shiftDate: string
        shiftCode: string
        plannedStartAt: string
        plannedEndAt: string
        plannedQuantity: number
    }>
}

export type ProductionOrder = {
    id: string
    /** Planlanmış işler ve vardiya lotları (Dilim 2.3). */
    jobs: ProductionOrderJob[]
    /** Ekranda "UE-1001" (core `formatProductionOrderNumber`). */
    orderNumber: number
    productVariantId: string | null
    /** Oluşturma anındaki varyant kodu — varyant silinse de kalır. */
    variantCode: string
    quantity: number
    /** "YYYY-MM-DD" */
    dueDate: string | null
    priority: ProductionPriority
    source: ProductionOrderSource
    customerId: string | null
    customer: { id: string; name: string } | null
    cycleTimeOverrideSec: number | null
    status: ProductionOrderStatus
    notes: string | null
    createdByUserId: string | null
    createdByUser: { id: string; firstName: string | null; lastName: string | null } | null
    /** Varyant katalogdan silinmişse `null`. */
    productVariant: {
        id: string
        fullCode: string
        product: { id: string; code: string; name: string }
        size: { id: string; code: number; sizeCode: string; label: string }
        version: ReferenceVariantVersion
        /** Varyanta özel çevrim (sn); girilmemişse `null`. */
        cycleTimeSec: number | null
        molds: ReferenceMoldSummary[]
    } | null
    createdAt: string
    updatedAt: string
}

export type ProductionOrderInput = {
    productVariantId: string
    quantity: number
    dueDate: string | null
    priority: ProductionPriority
    source: ProductionOrderSource
    customerId: string | null
    cycleTimeOverrideSec: number | null
    notes: string | null
}

export type ProductionOrderUpdateInput = Partial<ProductionOrderInput> & { status?: ProductionOrderStatus }

export type ProductionOrderListQuery = { page: number; limit: number; q: string; status: string }

export type ProductionOrderList = {
    data: ProductionOrder[]
    meta: { page: number; limit: number; total: number; totalPages: number }
}

export type PlannedLot = {
    sequence: number
    workday: string
    shiftCode: string
    startAt: string
    endAt: string
    shots: number
    quantity: number
}

export type OrderCandidate = {
    machine: { id: string; code: string; name: string }
    mold: { id: string; code: string; name: string }
    cavities: number
    verdict: "ok" | "warning" | "unknown"
    notes: string[]
    isPreferred: boolean
    cycleTimeSec: number
    cycleSource: "order" | "machineCard" | "variant" | "mold"
    shots: number
    setupMinutes: number
    productionMinutes: number
    setupStartAt: string | null
    productionStartAt: string | null
    endAt: string | null
    meetsDueDate: boolean | null
    machineCost: number | null
    currency: string
    lots: PlannedLot[]
    isEarliest: boolean
    isCheapest: boolean
    missingShiftPattern: boolean
}

export type OrderCandidates = {
    order: { id: string; orderNumber: number; quantity: number; dueDate: string | null; variantCode: string }
    generatedAt: string
    horizonDays: number
    candidates: OrderCandidate[]
    excluded: Array<{ machineCode: string; moldCode: string; reasons: string[] }>
}

export type PlanProductionOrderInput = {
    machineId: string
    moldId?: string
    /** ISO — en erken bağlama başı. */
    startAt?: string
    placement?: "first-gap" | "push-later"
}

export type PlanProductionOrderResult = {
    order: ProductionOrder
    /** İstenen an doluydu / vardiya dışıydı → ilk uygun boşluğa kaydı. */
    shifted: boolean
    /** "Sonrakileri kaydır" ile yeri değişen işler. */
    shiftedJobs: Array<{ id: string; lotBaseNumber: number; fromStartAt: string; toStartAt: string }>
}
