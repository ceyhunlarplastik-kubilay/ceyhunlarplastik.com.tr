import type { ProductionJobStatus } from "@/features/production/orders/api/types"

/** `GET /production/stats/products` — tarihler ISO metin. Hesap kuralları core `productionStats.ts`. */
export type ProductHistorySize = { id: string; sizeCode: string; label: string }

export type ProductHistoryVersion = {
    code: string
    colorName: string | null
    colorHex: string | null
    materials: string[]
}

export type ProductHistoryRow = {
    jobId: string
    jobOutputId: string
    lotBaseNumber: number
    jobStatus: ProductionJobStatus
    /** Kapanıştaki kesin sayım mı (değilse raporlu vardiyaların toplamı — iş sürüyor). */
    finalCount: boolean
    machineCode: string
    moldCode: string
    cavities: number
    size: ProductHistorySize
    version: ProductHistoryVersion | null
    order: { orderNumber: string; variantCode: string } | null
    plannedStartAt: string
    plannedEndAt: string
    startedAt: string | null
    endedAt: string | null
    lotCount: number
    reportedLotCount: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    scrapRate: number | null
    plannedCycleSec: number
    actualCycleSec: number | null
    plannedMinutes: number
    grossMinutes: number
    runMinutes: number
}

export type ProductHistorySummary = {
    jobCount: number
    rowCount: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    scrapRate: number | null
    reportedLotCount: number
    plannedCycleSec: number | null
    actualCycleSec: number | null
    truncated: boolean
}

export type ProductHistory = {
    product: { id: string; code: string; name: string }
    range: { from: string; to: string }
    /** Süzgeç seçenekleri: ürün modelinin tüm ölçüleri ve versiyonları. */
    sizes: ProductHistorySize[]
    versions: Array<ProductHistoryVersion & { signature: string }>
    rows: ProductHistoryRow[]
    summary: ProductHistorySummary
}

export type ProductHistoryQuery = {
    productId: string
    /** "" = tüm ölçüler */
    sizeId: string
    /** "" = tüm versiyonlar (imza) */
    version: string
    from: string
    to: string
}

/** `GET /production/stats/machines` — hesap kuralları core `machineStats.ts`. */
export type StopCategory = "PLANNED" | "BREAKDOWN" | "MATERIAL" | "QUALITY" | "PERSONNEL" | "OTHER"
export type DowntimeKind = "PLANNED_MAINTENANCE" | "BREAKDOWN" | "OTHER"

export type MachineTimeBreakdown = {
    capacityMinutes: number
    /** Pencerede raporlu üretimde geçen süre (vardiya dışı dahil). */
    productionMinutes: number
    overtimeMinutes: number
    runMinutes: number
    stopMinutes: Record<StopCategory, number>
    downtimeMinutes: Record<DowntimeKind, number>
    idleMinutes: number
}

export type MachineReportTotals = {
    reportedLotCount: number
    unreportedLotCount: number
    grossMinutes: number
    stopMinutes: Record<StopCategory, number>
    runMinutes: number
    shots: number
    idealMinutes: number
    goodQuantity: number
    scrapQuantity: number
}

export type MachineStatsTotals = {
    time: MachineTimeBreakdown
    report: MachineReportTotals
    utilization: number | null
    availability: number | null
    performance: number | null
    quality: number | null
    oee: number | null
}

export type MachineStatsRow = MachineStatsTotals & { machineId: string; code: string; name: string; areaCode: string }

export type StopReasonTotal = {
    reasonId: string
    code: string
    name: string
    category: StopCategory
    minutes: number
    count: number
}

export type MachineStats = {
    /** `endAt` şimdiye kırpılmış pencere sonu. */
    range: { from: string; to: string; startAt: string; endAt: string }
    generatedAt: string
    areaId: string | null
    /** Süzgeç seçenekleri: makinesi olan alanlar. */
    areas: Array<{ id: string; code: string; name: string }>
    rows: MachineStatsRow[]
    totals: MachineStatsTotals
    stopReasons: StopReasonTotal[]
}

export type MachineStatsQuery = {
    /** "" = tüm alanlar */
    areaId: string
    from: string
    to: string
}

/** `GET /production/stats/molds` — kurallar core `moldStats.ts`. */
export type CycleTotals = {
    reportedLotCount: number
    shots: number
    runMinutes: number
    goodQuantity: number
    scrapQuantity: number
    actualCycleSec: number | null
    plannedCycleSec: number | null
    /** Gerçek ÷ plan − 1. */
    deviation: number | null
}

export type CycleSuggestion = {
    cycleTimeSec: number
    referenceSec: number
    /** Karşılaştırılan: karttaki çevrim ya da (kart yoksa) planların varsaydığı. */
    referenceSource: "card" | "plan"
    deviation: number
}

export type MoldMachineCycleStats = CycleTotals & {
    machineId: string
    machineCode: string
    hasCard: boolean
    cardCycleSec: number | null
    suggestion: CycleSuggestion | null
}

export type MoldVersionCycleStats = CycleTotals & {
    versionSignature: string
    colorName: string | null
    colorHex: string | null
    materials: string[]
}

export type MoldMaintenanceLevel = "NONE" | "OK" | "SOON" | "DUE"

export type MoldStatsRow = CycleTotals & {
    moldId: string
    code: string
    name: string
    status: "ACTIVE" | "IN_MAINTENANCE" | "BROKEN" | "RETIRED"
    standardCycleTimeSec: number
    totalShots: number
    lastMaintenanceAt: string | null
    maintenance: {
        level: MoldMaintenanceLevel
        projectedLevel: MoldMaintenanceLevel
        shotsSinceMaintenance: number
        intervalShots: number | null
        remainingShots: number | null
        ratio: number | null
    }
    /** Açık işlerin henüz basılmamış baskısı. */
    shotsAhead: number
    scrapRate: number | null
    machines: MoldMachineCycleStats[]
    versions: MoldVersionCycleStats[]
    suggestionCount: number
}

export type MoldStatsSummary = {
    moldCount: number
    usedMoldCount: number
    reportedLotCount: number
    shots: number
    goodQuantity: number
    scrapQuantity: number
    scrapRate: number | null
    maintenanceAlertCount: number
    suggestionCount: number
}

export type MoldStats = {
    range: { from: string; to: string }
    generatedAt: string
    rows: MoldStatsRow[]
    summary: MoldStatsSummary
}

export type MoldStatsQuery = { from: string; to: string }
