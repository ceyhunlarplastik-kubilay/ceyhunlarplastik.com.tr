"use client"

import dynamic from "next/dynamic"
import type { CustomerMapPoint } from "@/features/customerLocations/types"

const DynamicManagedCustomerMapClient = dynamic(
    () => import("@/features/customerLocations/components/ManagedCustomerMapClient").then((mod) => mod.ManagedCustomerMapClient),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[620px] items-center justify-center rounded-3xl border border-neutral-200 bg-white text-sm text-neutral-500 shadow-sm">
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

type Props = {
    points: CustomerMapPoint[]
    activePoint: CustomerMapPoint | null
    onActivePointChange: (point: CustomerMapPoint | null) => void
    onBoundsChange: (bounds: Bounds) => void
    customerDetailHref: (customerId: string) => string
    isFetching?: boolean
}

export function ManagedCustomerMap(props: Props) {
    return <DynamicManagedCustomerMapClient {...props} />
}

