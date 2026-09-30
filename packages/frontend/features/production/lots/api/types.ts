import type { ProductionJobStatus } from "@core/helpers/production/jobStateMachine"
import type { LotOperatorSource, ProductionLotNoteCategory } from "@core/helpers/production/productionLots"
import type { ProductionStopCategory } from "@core/helpers/production/productionReasons"

export type ProductionLotStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "CANCELLED"

export type OperatorRef = { id: string; firstName: string; lastName: string; employeeNo: string | null; isActive: boolean }

export type LotOutput = {
    jobOutputId: string
    sizeCode: string
    productName: string
    cavities: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    /** Fire kırılımı; toplamı `scrapQuantity`'den azsa kalanı "belirtilmemiş". */
    scrapReasons: Array<{ reason: { id: string; code: string; name: string }; quantity: number }>
    order: { id: string; orderNumber: string; variantCode: string; quantity: number; dueDate: string | null } | null
}

export type LotOperators = { source: LotOperatorSource; list: OperatorRef[] }

/** `GET /production/lots` satırı — tarihler ISO metin. */
export type LotListItem = {
    id: string
    lotNumber: string
    sequence: number
    shiftDate: string
    shiftCode: string
    plannedStartAt: string
    plannedEndAt: string
    plannedShots: number
    status: ProductionLotStatus
    /** Vardiya raporu — `reportedAt` boşsa rapor girilmemiş. */
    actualStartAt: string | null
    actualEndAt: string | null
    actualShots: number | null
    reportedAt: string | null
    stopMinutes: number
    job: {
        id: string
        lotBaseNumber: number
        status: ProductionJobStatus
        /** İyimser kilit — başlatma / rapor isteğinde `expectedVersion`. */
        version: number
        machine: { id: string; code: string; name: string }
        mold: { id: string; code: string; name: string }
    }
    colorHex: string | null
    colorName: string | null
    outputs: LotOutput[]
    operators: LotOperators
    noteCount: number
}

export type LotList = {
    data: LotListItem[]
    meta: { page: number; limit: number; total: number; totalPages: number }
    /** Uygulanan tarih aralığı; arama varsa `null` (tüm tarihler). */
    range: { from: string; to: string } | null
}

export type LotListQuery = { page: number; limit: number; from: string; to: string; machineId: string; q: string }

export type LotNote = {
    id: string
    category: ProductionLotNoteCategory
    body: string
    createdAt: string
    authorUserId: string | null
    author: { id: string; firstName: string | null; lastName: string | null } | null
    operator: OperatorRef | null
    canDelete: boolean
}

export type LotDetail = Omit<LotListItem, "job"> & {
    job: LotListItem["job"] & {
        setupStartAt: string
        productionStartAt: string
        plannedEndAt: string
        plannedShots: number
        cycleTimeSec: number
    }
    siblings: Array<{ lotNumber: string; sequence: number; shiftDate: string; shiftCode: string; plannedStartAt: string; plannedEndAt: string; status: ProductionLotStatus; reportedAt: string | null }>
    reportedBy: { id: string; firstName: string | null; lastName: string | null } | null
    stops: Array<{
        id: string
        durationMinutes: number
        startAt: string | null
        note: string | null
        reason: { id: string; code: string; name: string; stopCategory: ProductionStopCategory | null }
    }>
    rosterOperators: OperatorRef[]
    notes: LotNote[]
}

export type LotNoteInput = { category: ProductionLotNoteCategory; body: string; operatorId: string | null }

/** `PUT /production/lots/{lotNumber}/report` gövdesi — tarihler ISO. */
export type LotReportInput = {
    actualStartAt: string
    actualEndAt: string
    actualShots: number | null
    outputs: Array<{ jobOutputId: string; goodQuantity: number; scrapQuantity: number; scrapReasons: Array<{ reasonId: string; quantity: number }> }>
    stops: Array<{ reasonId: string; durationMinutes: number; startAt: string | null; note: string | null }>
    handoverNote: { body: string; operatorId: string | null } | null
    expectedVersion: number
}

export type LotReportResult = { lotNumber: string; jobVersion: number; shots: number; nextLotNumber: string | null; correction: boolean }
