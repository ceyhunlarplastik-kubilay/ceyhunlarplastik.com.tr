"use client"

import { createContext, useContext, type ReactNode } from "react"

import {
    useProductionRealtime,
    type ProductionRealtimeState,
} from "@/features/production/realtime/hooks/useProductionRealtime"

const ProductionRealtimeContext = createContext<ProductionRealtimeState>({ status: "disabled", lastChange: null })

/** `/uretim` panelinde canlı güncellemeyi BİR kez başlatır; gösterge durumu bağlamdan okur. */
export function ProductionRealtimeProvider({ children }: { children: ReactNode }) {
    const state = useProductionRealtime()
    return <ProductionRealtimeContext.Provider value={state}>{children}</ProductionRealtimeContext.Provider>
}

export function useProductionRealtimeState(): ProductionRealtimeState {
    return useContext(ProductionRealtimeContext)
}
