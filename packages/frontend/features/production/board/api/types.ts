import type { ForecastState } from "@core/helpers/production/jobForecast"
import type { LotExecutionStatus } from "@core/helpers/production/lotReports"
import type { CompatibilityLevel } from "@core/helpers/production/moldMachineCompatibility"
import type { MoldMaintenanceStatus } from "@core/helpers/production/moldMaintenance"
import type { CalendarExceptionKind } from "@core/helpers/production/productionCalendar"
import type { ProductionJobStatus, ProductionOrderStatus, ProductionPriority } from "@/features/production/orders/api/types"
import type { ProductionMachineStatus } from "@/features/production/shared/machineStatus"
import type { MachineDowntimeKind } from "@/features/production/shared/downtimeKinds"

/** `GET /production/board` — dar DTO; tarihler ISO metin. */
export type BoardShift = { workday: string; shiftCode: string; shiftName: string; startAt: string; endAt: string }

export type BoardMachine = {
    id: string
    code: string
    name: string
    status: ProductionMachineStatus
    area: { id: string; code: string; name: string }
    shiftPatternName: string | null
    shifts: BoardShift[]
    dayExceptions: Array<{ date: string; kind: CalendarExceptionKind }>
}

export type BoardDowntime = {
    id: string
    machineId: string
    startAt: string
    endAt: string
    kind: MachineDowntimeKind
    reason: string | null
}

export type BoardJobLot = {
    lotNumber: string
    sequence: number
    shiftDate: string
    shiftCode: string
    plannedStartAt: string
    plannedEndAt: string
    plannedShots: number
    /** Gerçekleşen (4.2 vardiya raporu): üretimdeki lotun yalnız başlangıcı dolu. */
    status: LotExecutionStatus
    actualStartAt: string | null
    actualEndAt: string | null
    actualShots: number | null
    reported: boolean
}

/** Planlanan ↔ gerçekleşen (4.3) — sunucu `core/helpers/production/jobForecast.ts` ile hesaplar. */
export type BoardJobForecast = {
    state: ForecastState
    /** 0–1 */
    progress: number
    reportedShots: number
    remainingShots: number
    /** `null`: makinenin takviminde yer yok (hesaplanamadı). */
    projectedEndAt: string | null
    delayMinutes: number | null
    dueRisk: boolean
}

export type BoardJob = {
    id: string
    lotBaseNumber: number
    status: ProductionJobStatus
    /** İyimser kilit — taşıma isteğinde `expectedVersion`. */
    version: number
    machineId: string
    mold: { id: string; code: string; name: string; totalShots: number; maintenanceIntervalShots: number | null; shotsAtLastMaintenance: number }
    setupStartAt: string
    productionStartAt: string
    plannedEndAt: string
    plannedShots: number
    cycleTimeSec: number
    efficiencyPercent: number
    setupMinutes: number
    forecast: BoardJobForecast
    /** Kalıbın bakım durumu; `projectedLevel` tahtadaki planlı baskılar dahil. */
    moldMaintenance: MoldMaintenanceStatus
    colorHex: string | null
    colorName: string | null
    outputs: Array<{
        productSizeId: string
        cavities: number
        plannedQuantity: number
        order: { id: string; orderNumber: string; variantCode: string; quantity: number; dueDate: string | null } | null
    }>
    lots: BoardJobLot[]
    /** Görünen makinelerle kalıp uygunluğu; `error` olan satıra taşınamaz. */
    machineFit: Array<{ machineId: string; verdict: CompatibilityLevel; reason: string | null }>
}

/** Planlanmayı bekleyen (Taslak) emir — tahtaya sürüklenen kart. */
export type BoardPendingOrder = {
    id: string
    orderNumber: number
    status: ProductionOrderStatus
    variantCode: string
    productName: string
    sizeLabel: string
    quantity: number
    dueDate: string | null
    priority: ProductionPriority
    colorHex: string | null
    colorName: string | null
    /** Emrin kalıplarından en iyisinin makineye uygunluğu. */
    machineFit: Array<{ machineId: string; verdict: CompatibilityLevel }>
}

/** Çakışmada: ilk uygun boşluğa koy ya da o ana yerleş + sonrakileri kaydır. */
export type PlacementMode = "first-gap" | "push-later"

export type ShiftedJob = { id: string; lotBaseNumber: number; fromStartAt: string; toStartAt: string }

export type RescheduleJobInput = { machineId: string; startAt: string; expectedVersion: number; placement?: PlacementMode }

export type RescheduleJobResult = {
    job: { id: string; version: number; machineId: string; setupStartAt: string; productionStartAt: string; plannedEndAt: string; lotCount: number }
    requestedStartAt: string
    shifted: boolean
    shiftedJobs: ShiftedJob[]
}

/** Gecikme önerisi: geciken işin arkasındaki planlı işler tahmini bitişe kaydırıldı. */
export type PushJobFollowersResult = { projectedEndAt: string; delayMinutes: number; shiftedJobs: ShiftedJob[] }

export type ProductionBoard = {
    range: { from: string; to: string; startAt: string; endAt: string }
    generatedAt: string
    machines: BoardMachine[]
    downtimes: BoardDowntime[]
    jobs: BoardJob[]
    pendingOrders: BoardPendingOrder[]
    /** Taslak emir sayısı (panel en çok 50 kart gösterir). */
    pendingOrderTotal: number
}
