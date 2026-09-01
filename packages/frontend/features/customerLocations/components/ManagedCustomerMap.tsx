"use client"

import dynamic from "next/dynamic"
import type { CustomerMapPoint } from "@/features/customerLocations/types"

const DynamicManagedCustomerMapClient = dynamic(
    () => import("@/features/customerLocations/components/ManagedCustomerMapClient").then((mod) => mod.ManagedCustomerMapClient),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-155 items-center justify-center rounded-3xl border border-neutral-200 bg-white text-sm text-neutral-500 shadow-sm">
                Harita yükleniyor...
            </div>
        ),
    },
)

type Bounds = {
    north: number
    south: number
    east: number
    west: number
}

type FocusFallback = {
    lat: number
    lng: number
    zoom: number
}

type Props = {
    points: CustomerMapPoint[]
    activePoint: CustomerMapPoint | null
    onActivePointChange: (point: CustomerMapPoint | null) => void
    onBoundsChange: (bounds: Bounds) => void
    customerDetailHref: (customerId: string) => string
    isFetching?: boolean
    /** `points` boşken haritada gösterilecek metin (segment henüz seçilmediyse vb.). */
    emptyHint?: string
    /**
     * Her artışta harita segmente odaklanır: nokta varsa sınırlarına `fitBounds`,
     * yoksa `focusFallback` (seçilen bölge merkezi) varsa oraya uçar.
     */
    focusToken?: number
    focusFallback?: FocusFallback | null
    /** Odak işlendiğinde çağrılır — sonuç sayısını üst katmana bildirir (toast vb.). */
    onFocusResolved?: (info: { pointCount: number }) => void
}

export function ManagedCustomerMap(props: Props) {
    return <DynamicManagedCustomerMapClient {...props} />
}

