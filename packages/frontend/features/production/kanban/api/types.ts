import type { ProductionJobStatus } from "@core/helpers/production/jobStateMachine"
import type { ProductionOrderStatus } from "@core/helpers/production/productionOrders"

/** `GET /production/kanban` — dar DTO; tarihler ISO metin. */
export type KanbanJobOutput = {
    id: string
    cavities: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    /** Raporlanan lotların toplamı — tamamlama dialog'unun önerisi. */
    reportedGoodQuantity: number
    reportedScrapQuantity: number
    sizeCode: string
    productName: string
    order: { id: string; orderNumber: string; variantCode: string; quantity: number; dueDate: string | null } | null
}

export type KanbanJob = {
    id: string
    lotBaseNumber: number
    status: ProductionJobStatus
    version: number
    updatedAt: string
    machine: { id: string; code: string; name: string; area: { id: string; code: string; name: string } }
    mold: { id: string; code: string; name: string }
    setupStartAt: string
    productionStartAt: string
    plannedEndAt: string
    plannedShots: number
    colorHex: string | null
    colorName: string | null
    lotCount: number
    /** Vardiya raporu girilmiş lot sayısı. */
    reportedLotCount: number
    outputs: KanbanJobOutput[]
}

export type ProductionKanban = { generatedAt: string; completedWindowDays: number; jobs: KanbanJob[] }

export type TransitionJobInput = {
    status: Exclude<ProductionJobStatus, "CANCELLED">
    expectedVersion: number
    outputs?: Array<{ jobOutputId: string; goodQuantity: number; scrapQuantity: number }>
}

export type TransitionJobResult = {
    job: { id: string; status: ProductionJobStatus; version: number }
    orders: Array<{ id: string; status: ProductionOrderStatus }>
}
