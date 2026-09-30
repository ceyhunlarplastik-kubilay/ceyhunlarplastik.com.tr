import type { QueryKey } from "@tanstack/react-query"

import type { ProductionChangeScope } from "@core/helpers/production/productionRealtime"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/**
 * Canlı güncellemede hangi sorgular tazelenir (4.4) — alan → sorgu öneki. Yalnız EKRANDA olan
 * sorgular yeniden çekilir; diğerleri bayat işaretlenir ve açılınca tazelenir.
 */
const SCOPE_QUERY_KEYS: Record<Exclude<ProductionChangeScope, "definitions">, () => QueryKey[]> = {
    // Plan: tahta, emirler, pano, lotlar / vardiya raporu; rapor kalıp sayacını ve istatistikleri de değiştirir.
    plan: () => [
        productionQueryKeys.boardAll(),
        productionQueryKeys.ordersAll(),
        productionQueryKeys.kanban(),
        productionQueryKeys.lotsAll(),
        productionQueryKeys.molds(),
        productionQueryKeys.statsAll(),
    ],
    // Lotun ekibi vardiya ekibinden türer.
    roster: () => [productionQueryKeys.rosterAll(), productionQueryKeys.lotsAll()],
    lots: () => [productionQueryKeys.lotsAll()],
    reasons: () => [productionQueryKeys.reasons()],
}

export function productionChangeQueryKeys(scopes: Iterable<ProductionChangeScope>): QueryKey[] {
    const unique = new Set(scopes)
    // Tanımlar (makine, kalıp, vardiya, takvim, duruş…) tahtadan listelere her yeri etkiler.
    if (unique.has("definitions")) return [productionQueryKeys.all]

    const keys = new Map<string, QueryKey>()
    for (const scope of unique) {
        if (scope === "definitions") continue
        for (const key of SCOPE_QUERY_KEYS[scope]()) keys.set(JSON.stringify(key), key)
    }
    return [...keys.values()]
}
