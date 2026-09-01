/// <reference types="google.maps" />

"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { LocateFixed } from "lucide-react"
import { MarkerClusterer } from "@googlemaps/markerclusterer"
import { AdvancedMarker, InfoWindow, Map, Pin, Polyline, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { GoogleMapsApiProvider, googleMapsBrowserApiKey, googleMapsMapId } from "@/features/customerLocations/components/GoogleMapsApiProvider"
import { GooglePlaceDetailsCard } from "@/features/customerLocations/components/GooglePlaceDetailsCard"
import { buildGoogleMapsDirectionsUrl } from "@/features/customerLocations/lib/buildGoogleMapsDirectionsUrl"
import { RoutePlannerPanel } from "@/features/customerLocations/routePlanning/RoutePlannerPanel"
import { useRoutePlanner } from "@/features/customerLocations/routePlanning/useRoutePlanner"
import type { CustomerMapPoint } from "@/features/customerLocations/types"

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

const DEFAULT_EMPTY_HINT = "Bu görünümde geçerli koordinatlı müşteri bulunmuyor."

/** Tek noktaya odaklanırken kullanılan zoom (fitBounds sıfır alanda aşırı yaklaşır). */
const SINGLE_POINT_ZOOM = 13

const WORLD_BOUNDS: Bounds = { north: 85, south: -85, east: 180, west: -180 }

function normalizeBounds(bounds: google.maps.LatLngBounds): Bounds {
    const northEast = bounds.getNorthEast()
    const southWest = bounds.getSouthWest()
    const east = northEast.lng()
    const west = southWest.lng()

    // Antimeridyen kesişiminde backend'in basit dikdörtgen sorgusu yerine dünya
    // aralığını kullan; böylece görünür noktalar yanlışlıkla elenmez.
    if (east < west) return WORLD_BOUNDS

    return {
        north: Math.min(85, northEast.lat()),
        south: Math.max(-85, southWest.lat()),
        east,
        west,
    }
}

export function customerPointRefId(point: Pick<CustomerMapPoint, "customerId" | "addressId">) {
    return `${point.customerId}:${point.addressId}`
}

/**
 * Bir pin'in görsel kimliği; değişmediyse marker yeniden yaratılmamalı. Rota
 * seçim durumu (`routeOrder`) da anahtara dahil — seçim değişince ilgili pin
 * otomatik sökülüp yeni renk/glyph ile yeniden kurulur.
 */
function markerKey(point: CustomerMapPoint, routeOrder: number | null | undefined) {
    const role = routeOrder === undefined ? "" : routeOrder === null ? "route" : `route:${routeOrder}`
    return `${point.customerId}:${point.addressId}:${point.latitude}:${point.longitude}:${point.status}:${role}`
}

/**
 * Her pan/zoom noktaların bir kısmını değiştirir. Tüm marker'ları söküp yeniden
 * kurmak yüzlerce PinElement/AdvancedMarkerElement ayırması demek; bunun yerine
 * yalnız giren ve çıkan pin'ler üzerinde çalışılır.
 */
function CustomerMarkerCluster({
    points,
    onSelect,
    routeSelection,
}: {
    points: CustomerMapPoint[]
    onSelect: (point: CustomerMapPoint) => void
    /** refId (`customerId:addressId`) → ziyaret sırası; sıra henüz optimize edilmediyse `null`. */
    routeSelection: Map<string, number | null>
}) {
    const map = useMap()
    const markerLibrary = useMapsLibrary("marker")
    // `Map` adı bu dosyada vis.gl bileşeni tarafından gölgeleniyor.
    const markersRef = useRef(new globalThis.Map<string, google.maps.marker.AdvancedMarkerElement>())
    const clustererRef = useRef<MarkerClusterer | null>(null)
    // Marker'lar yeniden kullanıldığı için click closure'ı taze kalmalı.
    const onSelectRef = useRef(onSelect)

    useEffect(() => {
        onSelectRef.current = onSelect
    }, [onSelect])

    useEffect(() => {
        if (!map || !markerLibrary) return

        const cache = markersRef.current
        const clusterer = clustererRef.current ?? new MarkerClusterer({ map })
        clustererRef.current = clusterer

        const keyOf = (point: CustomerMapPoint) => markerKey(point, routeSelection.get(customerPointRefId(point)))
        const nextKeys = new Set(points.map(keyOf))
        const removed: google.maps.marker.AdvancedMarkerElement[] = []
        for (const [key, marker] of cache) {
            if (nextKeys.has(key)) continue
            cache.delete(key)
            marker.map = null
            removed.push(marker)
        }

        const added: google.maps.marker.AdvancedMarkerElement[] = []
        for (const point of points) {
            const key = keyOf(point)
            if (cache.has(key)) continue

            const routeOrder = routeSelection.get(customerPointRefId(point))
            const isRouteSelected = routeSelection.has(customerPointRefId(point))
            const pin = new markerLibrary.PinElement({
                background: isRouteSelected ? "#1d4ed8" : (point.status === "CUSTOMER" ? "#0f766e" : "#c2410c"),
                borderColor: "#ffffff",
                glyphColor: "#ffffff",
                scale: isRouteSelected ? 1.05 : 0.9,
                glyph: routeOrder != null ? String(routeOrder) : undefined,
            })
            const marker = new markerLibrary.AdvancedMarkerElement({
                position: { lat: point.latitude, lng: point.longitude },
                title: point.companyName || point.fullName,
                content: pin.element,
                gmpClickable: true,
            })
            marker.addListener("click", () => onSelectRef.current(point))
            cache.set(key, marker)
            added.push(marker)
        }

        if (removed.length) clusterer.removeMarkers(removed, true)
        if (added.length) clusterer.addMarkers(added, true)
        if (removed.length || added.length) clusterer.render()
    }, [map, markerLibrary, points, routeSelection])

    // Yalnız unmount'ta topla: aksi halde her nokta değişiminde her şey sökülür
    // ve yeniden kullanım anlamsızlaşır.
    useEffect(() => {
        const cache = markersRef.current

        return () => {
            clustererRef.current?.clearMarkers()
            clustererRef.current?.setMap(null)
            clustererRef.current = null
            cache.forEach((marker) => {
                marker.map = null
            })
            cache.clear()
        }
    }, [])

    return null
}

function ManagedCustomerGoogleMap({
    points,
    activePoint,
    onActivePointChange,
    onBoundsChange,
    customerDetailHref,
    isFetching,
    emptyHint,
    focusToken,
    focusFallback,
    onFocusResolved,
}: Props) {
    const map = useMap()
    const coreLibrary = useMapsLibrary("core")
    const routePlanner = useRoutePlanner()

    // "Haritada Göster" sonrası: sonuç geldiğinde haritayı segmente odakla.
    // Öncelik: müşteri noktaları → yoksa seçilen bölgenin merkezi (`focusFallback`).
    // Her `focusToken` bir kez işlenir; taze veri beklenir (`isFetching`), sonuç
    // 0 ve fallback yoksa görünüm korunur. `onFocusResolved` sonucu üst katmana
    // bildirir (toast).
    const handledFocusTokenRef = useRef<number | undefined>(focusToken)
    const onFocusResolvedRef = useRef(onFocusResolved)
    useEffect(() => {
        onFocusResolvedRef.current = onFocusResolved
    }, [onFocusResolved])

    useEffect(() => {
        if (!map || !coreLibrary) return
        if (focusToken === undefined || focusToken === handledFocusTokenRef.current) return
        if (isFetching) return

        handledFocusTokenRef.current = focusToken

        if (points.length === 1) {
            map.setCenter({ lat: points[0].latitude, lng: points[0].longitude })
            map.setZoom(SINGLE_POINT_ZOOM)
        } else if (points.length > 1) {
            const bounds = new coreLibrary.LatLngBounds()
            for (const point of points) {
                bounds.extend({ lat: point.latitude, lng: point.longitude })
            }
            map.fitBounds(bounds, 64)
        } else if (focusFallback) {
            // Sonuç yok ama kullanıcı bir bölge seçti — yine de oraya uç ki
            // "burada müşteri yok" görsel olarak da anlaşılsın.
            map.setCenter({ lat: focusFallback.lat, lng: focusFallback.lng })
            map.setZoom(focusFallback.zoom)
        }

        onFocusResolvedRef.current?.({ pointCount: points.length })
    }, [map, coreLibrary, focusToken, isFetching, points, focusFallback])

    const routeSelection = useMemo(() => {
        // `Map` adı bu dosyada vis.gl bileşeni tarafından gölgeleniyor.
        const selection = new globalThis.Map<string, number | null>()
        if (routePlanner.state.result) {
            for (const stop of routePlanner.state.result.orderedStops) selection.set(stop.refId, stop.order)
        } else {
            for (const stop of routePlanner.state.stops) selection.set(stop.refId, null)
        }
        return selection
    }, [routePlanner.state.result, routePlanner.state.stops])

    function handleMarkerSelect(point: CustomerMapPoint) {
        if (routePlanner.state.active) {
            routePlanner.handleMarkerClick({
                refId: customerPointRefId(point),
                lat: point.latitude,
                lng: point.longitude,
                label: point.companyName || point.fullName,
                source: "CUSTOMER_PIN",
            })
            return
        }
        onActivePointChange(point)
    }

    function goToBrowserLocation() {
        navigator.geolocation?.getCurrentPosition((position) => {
            map?.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude })
            map?.setZoom(13)
        })
    }

    return (
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <Map
                mapId={googleMapsMapId}
                defaultCenter={{ lat: 39.1, lng: 35.15 }}
                defaultZoom={5}
                style={{ width: "100%", height: 620 }}
                gestureHandling="cooperative"
                streetViewControl={false}
                mapTypeControl={false}
                fullscreenControl
                reuseMaps
                onClick={() => onActivePointChange(null)}
                onIdle={(event) => {
                    const bounds = event.map.getBounds()
                    if (bounds) onBoundsChange(normalizeBounds(bounds))
                }}
            >
                <CustomerMarkerCluster points={points} onSelect={handleMarkerSelect} routeSelection={routeSelection} />

                {routePlanner.state.result ? (
                    <Polyline
                        encodedPath={routePlanner.state.result.encodedPolyline}
                        strokeColor="#1d4ed8"
                        strokeOpacity={0.85}
                        strokeWeight={4}
                    />
                ) : null}

                {routePlanner.state.origin ? (
                    <AdvancedMarker
                        position={{ lat: routePlanner.state.origin.lat, lng: routePlanner.state.origin.lng }}
                        title={routePlanner.state.origin.label}
                        zIndex={10}
                    >
                        <Pin background="#16a34a" borderColor="#14532d" glyphColor="#ffffff" glyph="A" />
                    </AdvancedMarker>
                ) : null}

                {routePlanner.state.destination ? (
                    <AdvancedMarker
                        position={{ lat: routePlanner.state.destination.lat, lng: routePlanner.state.destination.lng }}
                        title={routePlanner.state.destination.label}
                        zIndex={10}
                    >
                        <Pin background="#dc2626" borderColor="#7f1d1d" glyphColor="#ffffff" glyph="B" />
                    </AdvancedMarker>
                ) : null}

                {activePoint ? (
                    (() => {
                        const isGooglePlace =
                            activePoint.geocodingProvider === "google_places" && Boolean(activePoint.geocodingPlaceId)

                        return (
                            <InfoWindow
                                position={{ lat: activePoint.latitude, lng: activePoint.longitude }}
                                pixelOffset={[0, -28]}
                                shouldFocus={false}
                                onCloseClick={() => onActivePointChange(null)}
                            >
                                {/* Google kartı yatay düzende ~360px altında fotoğrafı gizliyor;
                                    o dalda genişlik kısıtlanmaz (CustomerLocationPicker ile aynı). */}
                                <div
                                    className={
                                        isGooglePlace
                                            ? "w-90 max-w-[calc(100vw-7rem)] space-y-2.5"
                                            : "min-w-60 max-w-80 space-y-2.5 pr-1"
                                    }
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-950">
                                            {activePoint.companyName || activePoint.fullName}
                                        </div>
                                        {activePoint.companyName ? (
                                            <div className="text-xs text-neutral-500">{activePoint.fullName}</div>
                                        ) : null}
                                    </div>

                                    {isGooglePlace ? (
                                        // Adres Google Places'ten geldiyse native işletme kartı
                                        // (fotoğraf, puan, adres, yol tarifi Google'ın kendi
                                        // kartından). CustomerLocationPicker ile aynı bileşen.
                                        <GooglePlaceDetailsCard
                                            placeId={activePoint.geocodingPlaceId!}
                                            widthCss="min(360px, calc(100vw - 112px))"
                                            className="min-h-16 w-full"
                                        />
                                    ) : (
                                        <>
                                            <div className="space-y-1 text-sm text-neutral-700">
                                                <div className="font-medium text-neutral-900">{activePoint.addressLabel}</div>
                                                <div>{activePoint.addressSummary}</div>
                                            </div>
                                            <Button asChild size="sm" className="w-full">
                                                <a
                                                    href={buildGoogleMapsDirectionsUrl(activePoint.latitude, activePoint.longitude)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Google Maps’te Yol Tarifi
                                                </a>
                                            </Button>
                                        </>
                                    )}

                                    <Button asChild size="sm" variant="outline" className="w-full">
                                        <Link href={customerDetailHref(activePoint.customerId)}>Müşteri Detayını Aç</Link>
                                    </Button>
                                </div>
                            </InfoWindow>
                        )
                    })()
                ) : null}
            </Map>

            <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-3 top-14 z-10 bg-white shadow-md"
                title="Konumuma git"
                aria-label="Konumuma git"
                onClick={goToBrowserLocation}
            >
                <LocateFixed className="h-4 w-4" />
            </Button>

            <RoutePlannerPanel
                state={routePlanner.state}
                toggleActive={routePlanner.toggleActive}
                armPicking={routePlanner.armPicking}
                disarmPicking={routePlanner.disarmPicking}
                setOrigin={routePlanner.setOrigin}
                setDestination={routePlanner.setDestination}
                removeStop={routePlanner.removeStop}
                setResult={routePlanner.setResult}
                reset={routePlanner.reset}
            />

            {isFetching ? (
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm" role="status" aria-live="polite">
                    Harita verisi güncelleniyor...
                </div>
            ) : null}

            {points.length === 0 ? (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-dashed border-neutral-200 bg-white/95 px-4 py-3 text-sm text-neutral-500 shadow-sm">
                    {emptyHint ?? DEFAULT_EMPTY_HINT}
                </div>
            ) : null}
        </div>
    )
}

function MissingGoogleConfiguration({ onBoundsChange }: Pick<Props, "onBoundsChange">) {
    useEffect(() => onBoundsChange(WORLD_BOUNDS), [onBoundsChange])

    return (
        <div className="flex h-155 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800 shadow-sm" role="alert">
            Google Maps anahtarı veya Map ID tanımlı değil. Harita dağıtımdan önce SST secret’larıyla yapılandırılmalı.
        </div>
    )
}

export function ManagedCustomerMapClient(props: Props) {
    const [loadError, setLoadError] = useState(false)

    if (!googleMapsBrowserApiKey || !googleMapsMapId) {
        return <MissingGoogleConfiguration onBoundsChange={props.onBoundsChange} />
    }

    if (loadError) {
        return (
            <div className="flex h-155 items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm" role="alert">
                Google Maps yüklenemedi veya günlük kota doldu. Daha sonra yeniden deneyin.
            </div>
        )
    }

    return (
        <GoogleMapsApiProvider onError={() => setLoadError(true)}>
            <ManagedCustomerGoogleMap {...props} />
        </GoogleMapsApiProvider>
    )
}
