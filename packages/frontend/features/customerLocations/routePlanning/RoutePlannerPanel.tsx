"use client"

import { useMemo } from "react"
import { ExternalLink, Loader2, Route, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    GOOGLE_MAPS_URL_MAX_INTERMEDIATE_STOPS,
    buildGoogleMapsMultiStopDirectionsUrl,
} from "@/features/customerLocations/lib/buildGoogleMapsMultiStopDirectionsUrl"
import { useOptimizeCustomerRoute } from "@/features/customerLocations/hooks/useOptimizeCustomerRoute"
import { RouteEndpointPicker } from "@/features/customerLocations/routePlanning/RouteEndpointPicker"
import { RouteStopsList } from "@/features/customerLocations/routePlanning/RouteStopsList"
import { formatRouteDistance, formatRouteDuration } from "@/features/customerLocations/routePlanning/routeFormatting"
import type { RoutePlannerState } from "@/features/customerLocations/routePlanning/useRoutePlanner"
import type { OptimizedRouteResult, RoutePoint } from "@/features/customerLocations/routePlanning/types"

type Props = {
    state: RoutePlannerState
    toggleActive: () => void
    armPicking: (target: "origin" | "destination") => void
    disarmPicking: () => void
    setOrigin: (point: RoutePoint) => void
    setDestination: (point: RoutePoint) => void
    removeStop: (refId: string) => void
    setResult: (result: OptimizedRouteResult) => void
    reset: () => void
}

export function RoutePlannerPanel({
    state,
    toggleActive,
    armPicking,
    disarmPicking,
    setOrigin,
    setDestination,
    removeStop,
    setResult,
    reset,
}: Props) {
    const optimizeMutation = useOptimizeCustomerRoute()

    const canOptimize = Boolean(state.origin && state.destination && state.stops.length > 0)
    const totalStopCount = state.stops.length + 2
    const exceedsGoogleMapsUrlLimit = totalStopCount > GOOGLE_MAPS_URL_MAX_INTERMEDIATE_STOPS + 2

    const googleMapsUrl = useMemo(() => {
        if (!state.result || !state.origin || !state.destination) return null
        return buildGoogleMapsMultiStopDirectionsUrl(
            state.origin,
            state.destination,
            state.result.orderedStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
        )
    }, [state.result, state.origin, state.destination])

    async function handleOptimize() {
        if (!state.origin || !state.destination) return

        let data
        try {
            data = await optimizeMutation.mutateAsync({
                origin: { lat: state.origin.lat, lng: state.origin.lng },
                destination: { lat: state.destination.lat, lng: state.destination.lng },
                waypoints: state.stops.map((stop) => ({ refId: stop.refId, lat: stop.lat, lng: stop.lng })),
            })
        } catch {
            // `useOptimizeCustomerRoute`'un onError'u zaten toast gösteriyor.
            return
        }

        const stopsByRefId = new Map(state.stops.map((stop) => [stop.refId, stop]))
        setResult({
            orderedStops: data.orderedWaypoints.map((waypoint, index) => ({
                ...(stopsByRefId.get(waypoint.refId) ?? {
                    refId: waypoint.refId,
                    lat: waypoint.lat,
                    lng: waypoint.lng,
                    label: waypoint.refId,
                    source: "CUSTOMER_PIN" as const,
                }),
                order: index + 1,
                legDistanceMeters: waypoint.legDistanceMeters,
                legDurationSeconds: waypoint.legDurationSeconds,
            })),
            finalLegDistanceMeters: data.finalLegDistanceMeters,
            finalLegDurationSeconds: data.finalLegDurationSeconds,
            totalDistanceMeters: data.totalDistanceMeters,
            totalDurationSeconds: data.totalDurationSeconds,
            encodedPolyline: data.encodedPolyline,
        })
    }

    if (!state.active) {
        return (
            <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute left-3 top-14 z-10 bg-white shadow-md"
                title="Rota Planlayıcı"
                aria-label="Rota Planlayıcı"
                onClick={toggleActive}
            >
                <Route className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <div className="absolute left-3 top-14 z-10 max-h-[calc(100%-4.5rem)] w-80 space-y-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <Route className="h-4 w-4 text-brand" />
                    Rota Planlayıcı
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Rota planlayıcıyı kapat" onClick={toggleActive}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            {state.pickingTarget ? (
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                    <span>Haritada bir nokta seçin ({state.pickingTarget === "origin" ? "başlangıç" : "bitiş"}).</span>
                    <button type="button" className="font-medium underline" onClick={disarmPicking}>İptal</button>
                </div>
            ) : null}

            <RouteEndpointPicker
                roleLabel="Başlangıç"
                point={state.origin}
                picking={state.pickingTarget === "origin"}
                onArmPicking={() => armPicking("origin")}
                onDisarmPicking={disarmPicking}
                onSelect={setOrigin}
            />

            <RouteEndpointPicker
                roleLabel="Bitiş"
                point={state.destination}
                picking={state.pickingTarget === "destination"}
                onArmPicking={() => armPicking("destination")}
                onDisarmPicking={disarmPicking}
                onSelect={setDestination}
            />

            <div className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Duraklar ({state.stops.length})
                </span>
                <RouteStopsList
                    stops={state.stops}
                    orderedStops={state.result?.orderedStops ?? null}
                    onRemove={removeStop}
                />
            </div>

            <Button type="button" className="w-full" disabled={!canOptimize || optimizeMutation.isPending} onClick={handleOptimize}>
                {optimizeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Rotayı Optimize Et
            </Button>

            {state.result ? (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    <div className="font-medium">
                        Toplam {formatRouteDistance(state.result.totalDistanceMeters)} · {formatRouteDuration(state.result.totalDurationSeconds)}
                    </div>
                    {googleMapsUrl ? (
                        <Button asChild size="sm" variant="outline" className="w-full bg-white">
                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                Google Maps’te Aç
                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                        </Button>
                    ) : null}
                    {exceedsGoogleMapsUrlLimit ? (
                        <p className="text-xs text-amber-700">
                            Google Maps arayüzü toplam {GOOGLE_MAPS_URL_MAX_INTERMEDIATE_STOPS + 2} duraktan fazlasını
                            güvenilir açmayabilir; bu rotada {totalStopCount} nokta var.
                        </p>
                    ) : null}
                </div>
            ) : null}

            <button type="button" className="text-xs font-medium text-neutral-500 underline hover:text-neutral-700" onClick={reset}>
                Rotayı Temizle
            </button>
        </div>
    )
}
