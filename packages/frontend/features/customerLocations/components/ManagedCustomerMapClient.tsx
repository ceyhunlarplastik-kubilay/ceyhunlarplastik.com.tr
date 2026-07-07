"use client"

import Link from "next/link"
import { useMemo, useRef } from "react"
import { GeolocateControl, Layer, NavigationControl, Popup, Source, Map } from "react-map-gl/maplibre"
import type { LayerProps, MapRef } from "react-map-gl/maplibre"
// Eskiden root layout'ta globaldi; artık yalnızca harita içeren sayfalarda yüklenir.
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection, Point } from "geojson"
import { Button } from "@/components/ui/button"
import { buildGoogleMapsDirectionsUrl } from "@/features/customerLocations/lib/buildGoogleMapsDirectionsUrl"
import type { CustomerMapPoint } from "@/features/customerLocations/types"

type Bounds = {
    north: number
    south: number
    east: number
    west: number
}

const WORLD_MIN_LATITUDE = -85.051129
const WORLD_MAX_LATITUDE = 85.051129
const WORLD_MIN_LONGITUDE = -180
const WORLD_MAX_LONGITUDE = 180

type Props = {
    points: CustomerMapPoint[]
    activePoint: CustomerMapPoint | null
    onActivePointChange: (point: CustomerMapPoint | null) => void
    onBoundsChange: (bounds: Bounds) => void
    customerDetailHref: (customerId: string) => string
    isFetching?: boolean
}

const clusterLayer: LayerProps = {
    id: "clusters",
    type: "circle",
    source: "customers",
    filter: ["has", "point_count"],
    paint: {
        "circle-color": "#c88b20",
        "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            20,
            24,
            50,
            30,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff7e6",
    },
}

const clusterCountLayer: LayerProps = {
    id: "cluster-count",
    type: "symbol",
    source: "customers",
    filter: ["has", "point_count"],
    layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
        "text-font": ["Open Sans Semibold"],
    },
    paint: {
        "text-color": "#111827",
    },
}

const unclusteredPointLayer: LayerProps = {
    id: "unclustered-point",
    type: "circle",
    source: "customers",
    filter: ["!", ["has", "point_count"]],
    paint: {
        "circle-color": [
            "match",
            ["get", "status"],
            "CUSTOMER",
            "#0f766e",
            "#c2410c",
        ],
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
    },
}

function clampLatitude(value: number) {
    return Math.min(Math.max(value, WORLD_MIN_LATITUDE), WORLD_MAX_LATITUDE)
}

function wrapLongitude(value: number) {
    const wrapped = ((((value + 180) % 360) + 360) % 360) - 180
    return wrapped === 180 ? WORLD_MAX_LONGITUDE : wrapped
}

function normalizeBounds(bounds: Bounds): Bounds {
    const north = clampLatitude(bounds.north)
    const south = clampLatitude(bounds.south)
    const rawSpan = bounds.east - bounds.west

    if (!Number.isFinite(rawSpan) || Math.abs(rawSpan) >= 360) {
        return {
            north,
            south,
            east: WORLD_MAX_LONGITUDE,
            west: WORLD_MIN_LONGITUDE,
        }
    }

    const east = wrapLongitude(bounds.east)
    const west = wrapLongitude(bounds.west)

    if (east < west) {
        return {
            north,
            south,
            east: WORLD_MAX_LONGITUDE,
            west: WORLD_MIN_LONGITUDE,
        }
    }

    return {
        north,
        south,
        east,
        west,
    }
}

export function ManagedCustomerMapClient({
    points,
    activePoint,
    onActivePointChange,
    onBoundsChange,
    customerDetailHref,
    isFetching = false,
}: Props) {
    const mapRef = useRef<MapRef | null>(null)

    const geoJson = useMemo<FeatureCollection<Point, Record<string, string | number | boolean | null>>>(
        () => ({
            type: "FeatureCollection",
            features: points.map((point) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [point.longitude, point.latitude],
                },
                properties: {
                    customerId: point.customerId,
                    addressId: point.addressId,
                    companyName: point.companyName ?? null,
                    fullName: point.fullName,
                    addressLabel: point.addressLabel,
                    addressSummary: point.addressSummary,
                    status: point.status,
                    isPrimary: point.isPrimary,
                    isShipping: point.isShipping,
                },
            })),
        }),
        [points],
    )

    function emitBounds() {
        const bounds = mapRef.current?.getBounds()
        if (!bounds) return

        onBoundsChange(normalizeBounds({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
        }))
    }

    return (
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <Map
                ref={mapRef}
                initialViewState={{ latitude: 39.1, longitude: 35.15, zoom: 5.25 }}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                style={{ width: "100%", height: 620 }}
                interactiveLayerIds={["clusters", "unclustered-point"]}
                onLoad={() => emitBounds()}
                onMoveEnd={() => emitBounds()}
                onClick={(event) => {
                    const feature = event.features?.[0]
                    if (!feature) {
                        onActivePointChange(null)
                        return
                    }

                    if (feature.layer.id === "clusters") {
                        const clusterId = feature.properties?.cluster_id as number | undefined
                        const source = mapRef.current?.getMap().getSource("customers") as {
                            getClusterExpansionZoom: (clusterId: number) => Promise<number>
                        } | undefined
                        if (!source || clusterId === undefined) return
                        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
                            mapRef.current?.easeTo({
                                center: (feature.geometry as Point).coordinates as [number, number],
                                zoom,
                                duration: 400,
                            })
                        })
                        return
                    }

                    const point = points.find((item) =>
                        item.customerId === feature.properties?.customerId
                        && item.addressId === feature.properties?.addressId,
                    ) ?? null
                    onActivePointChange(point)
                }}
            >
                <NavigationControl position="top-right" showCompass={false} />
                <GeolocateControl position="top-right" trackUserLocation={false} />
                <Source
                    id="customers"
                    type="geojson"
                    data={geoJson}
                    cluster
                    clusterMaxZoom={13}
                    clusterRadius={42}
                >
                    <Layer {...clusterLayer} />
                    <Layer {...clusterCountLayer} />
                    <Layer {...unclusteredPointLayer} />
                </Source>

                {activePoint ? (
                    <Popup
                        latitude={activePoint.latitude}
                        longitude={activePoint.longitude}
                        anchor="bottom"
                        offset={18}
                        closeOnClick={false}
                        onClose={() => onActivePointChange(null)}
                    >
                        <div className="min-w-[220px] max-w-[280px] space-y-3 pr-2">
                            <div>
                                <div className="text-sm font-semibold text-neutral-950">
                                    {activePoint.companyName || activePoint.fullName}
                                </div>
                                {activePoint.companyName ? (
                                    <div className="text-xs text-neutral-500">{activePoint.fullName}</div>
                                ) : null}
                            </div>

                            <div className="space-y-1 text-sm text-neutral-700">
                                <div className="font-medium text-neutral-900">{activePoint.addressLabel}</div>
                                <div>{activePoint.addressSummary}</div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button asChild size="sm" variant="outline">
                                    <Link href={customerDetailHref(activePoint.customerId)}>
                                        Müşteri Detayını Aç
                                    </Link>
                                </Button>
                                <Button asChild size="sm">
                                    <a
                                        href={buildGoogleMapsDirectionsUrl(activePoint.latitude, activePoint.longitude)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Google Maps’te Yol Tarifi
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </Popup>
                ) : null}
            </Map>

            {isFetching ? (
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
                    Harita verisi güncelleniyor...
                </div>
            ) : null}

            {points.length === 0 ? (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-dashed border-neutral-200 bg-white/95 px-4 py-3 text-sm text-neutral-500 shadow-sm">
                    Bu görünümde koordinatlı müşteri bulunmuyor.
                </div>
            ) : null}
        </div>
    )
}
