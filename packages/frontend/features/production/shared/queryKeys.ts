/**
 * Üretim planlama sorgu anahtarları — tek yerde, çünkü tanımlar birbirini gösteriyor:
 * makine listesi alan ve vardiya düzeni ADINI taşır, alan listesi makine sayısını.
 * Bir tanım değişince ilgili listeler birlikte tazelenir.
 */
export const productionQueryKeys = {
    all: ["production"] as const,
    areas: () => [...productionQueryKeys.all, "areas"] as const,
    shiftPatterns: () => [...productionQueryKeys.all, "shift-patterns"] as const,
    machines: () => [...productionQueryKeys.all, "machines"] as const,
    molds: () => [...productionQueryKeys.all, "molds"] as const,
    materialProfiles: () => [...productionQueryKeys.all, "material-profiles"] as const,
    referenceProducts: () => [...productionQueryKeys.all, "references", "products"] as const,
    referenceProductSizes: (productId: string) =>
        [...productionQueryKeys.all, "references", "products", productId, "sizes"] as const,
    referenceMoldableProducts: () => [...productionQueryKeys.all, "references", "moldable-products"] as const,
    referenceProductVariants: (productId: string) =>
        [...productionQueryKeys.all, "references", "products", productId, "variants"] as const,
    referenceCustomers: (search: string) => [...productionQueryKeys.all, "references", "customers", search] as const,
    ordersAll: () => [...productionQueryKeys.all, "orders"] as const,
    orders: (query: { page: number; limit: number; q: string; status: string }) =>
        [...productionQueryKeys.ordersAll(), query] as const,
    orderCandidates: (orderId: string) => [...productionQueryKeys.ordersAll(), "candidates", orderId] as const,
    operators: () => [...productionQueryKeys.all, "operators"] as const,
    /** Önek — yazma sonrası tüm yılların listesi birlikte tazelenir. */
    calendarExceptionsAll: () => [...productionQueryKeys.all, "calendar-exceptions"] as const,
    calendarExceptions: (range: { from: string; to: string }) =>
        [...productionQueryKeys.calendarExceptionsAll(), range] as const,
    machineDowntimesAll: () => [...productionQueryKeys.all, "machine-downtimes"] as const,
    machineDowntimes: (window: { from: string }) => [...productionQueryKeys.machineDowntimesAll(), window] as const,
    /** Önek — plan yazılınca / iş iptal edilince tüm pencereler tazelenir. */
    boardAll: () => [...productionQueryKeys.all, "board"] as const,
    board: (range: { from: string; to: string }) => [...productionQueryKeys.boardAll(), range] as const,
    kanban: () => [...productionQueryKeys.all, "kanban"] as const,
    /** Önek — lot listesi ve ayrıntıları birlikte tazelenir. */
    lotsAll: () => [...productionQueryKeys.all, "lots"] as const,
    lots: (query: { page: number; limit: number; from: string; to: string; machineId: string; q: string }) =>
        [...productionQueryKeys.lotsAll(), "list", query] as const,
    lot: (lotNumber: string) => [...productionQueryKeys.lotsAll(), "detail", lotNumber] as const,
    reasons: () => [...productionQueryKeys.all, "reasons"] as const,
    /** Önek — istatistikler (Faz 5); plan / saha değişikliği tümünü bayatlatır. */
    statsAll: () => [...productionQueryKeys.all, "stats"] as const,
    productHistory: (query: { productId: string; sizeId: string; version: string; from: string; to: string }) =>
        [...productionQueryKeys.statsAll(), "products", query] as const,
    machineStats: (query: { areaId: string; from: string; to: string }) =>
        [...productionQueryKeys.statsAll(), "machines", query] as const,
    moldStats: (query: { from: string; to: string }) =>
        [...productionQueryKeys.statsAll(), "molds", query] as const,
    rosterAll: () => [...productionQueryKeys.all, "roster"] as const,
    roster: (date: string) => [...productionQueryKeys.rosterAll(), date] as const,
}
