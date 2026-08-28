"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRouteDistance, formatRouteDuration } from "@/features/customerLocations/routePlanning/routeFormatting"
import type { OptimizedRouteStop, RouteStop } from "@/features/customerLocations/routePlanning/types"

type Props = {
    stops: RouteStop[]
    orderedStops: OptimizedRouteStop[] | null
    onRemove: (refId: string) => void
}

export function RouteStopsList({ stops, orderedStops, onRemove }: Props) {
    if (orderedStops) {
        return (
            <ul className="space-y-1.5">
                {orderedStops.map((stop) => (
                    <li
                        key={stop.refId}
                        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm"
                    >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                            {stop.order}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-neutral-800">{stop.label}</span>
                        <span className="shrink-0 text-xs text-neutral-500">
                            {formatRouteDistance(stop.legDistanceMeters)} · {formatRouteDuration(stop.legDurationSeconds)}
                        </span>
                    </li>
                ))}
            </ul>
        )
    }

    if (stops.length === 0) {
        return <p className="text-xs text-neutral-500">Haritadan işletme seçerek rotaya durak ekleyin.</p>
    }

    return (
        <ul className="space-y-1.5">
            {stops.map((stop) => (
                <li
                    key={stop.refId}
                    className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm"
                >
                    <span className="min-w-0 flex-1 truncate text-neutral-800">{stop.label}</span>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        aria-label={`${stop.label} durağını kaldır`}
                        onClick={() => onRemove(stop.refId)}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </li>
            ))}
        </ul>
    )
}
