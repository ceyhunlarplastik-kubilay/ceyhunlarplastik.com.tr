import type { ProductionReasonKind, ProductionStopCategory } from "@core/helpers/production/productionReasons"

export type ProductionReason = {
    id: string
    kind: ProductionReasonKind
    code: string
    name: string
    stopCategory: ProductionStopCategory | null
    isActive: boolean
    sortOrder: number
    /** Bu nedene bağlı duruş + fire kaydı — sıfırdan büyükse silinmez. */
    usageCount: number
}

export type ProductionReasonInput = {
    kind: ProductionReasonKind
    code: string
    name: string
    stopCategory: ProductionStopCategory | null
    isActive: boolean
    sortOrder: number
}
