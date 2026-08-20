"use client"

import { useEffect, useRef, useState } from "react"
import {
    AdvancedMarker,
    InfoWindow,
    Map,
    Pin,
    useAdvancedMarkerRef,
    useMap,
    useMapsLibrary,
} from "@vis.gl/react-google-maps"
import { googleMapsMapId } from "@/features/customerLocations/components/GoogleMapsApiProvider"

type Props = {
    latitude?: number | null
    longitude?: number | null
    googlePlaceId?: string | null
    placeLabel?: string | null
    onPick: (latitude: number, longitude: number) => void
}

const DEFAULT_CENTER = { lat: 39.1, lng: 35.15 }

function SelectedLocationCamera({ latitude, longitude }: Pick<Props, "latitude" | "longitude">) {
    const map = useMap()

    useEffect(() => {
        if (!map || latitude == null || longitude == null) return
        map.setCenter({ lat: latitude, lng: longitude })
        if ((map.getZoom() ?? 0) < 13) map.setZoom(15)
    }, [latitude, longitude, map])

    return null
}

function GooglePlaceDetails({ placeId }: { placeId: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const placesLibrary = useMapsLibrary("places")

    useEffect(() => {
        const container = containerRef.current
        if (!container || !placesLibrary) return

        const detailsElement = new placesLibrary.PlaceDetailsCompactElement({
            orientation: "HORIZONTAL",
            truncationPreferred: true,
        })
        const requestElement = new placesLibrary.PlaceDetailsPlaceRequestElement({ place: placeId })
        const contentElement = new placesLibrary.PlaceStandardContentElement()
        const handleError = () => {
            const message = document.createElement("p")
            message.className = "p-3 text-sm text-amber-800"
            message.textContent = "Google işletme bilgileri şu anda yüklenemedi."
            container.replaceChildren(message)
        }

        detailsElement.style.width = "min(360px, calc(100vw - 112px))"
        detailsElement.addEventListener("gmp-error", handleError)
        detailsElement.append(requestElement, contentElement)
        container.replaceChildren(detailsElement)

        return () => {
            detailsElement.removeEventListener("gmp-error", handleError)
            container.replaceChildren()
        }
    }, [placeId, placesLibrary])

    return <div ref={containerRef} className="min-h-16 min-w-60" aria-label="Google işletme bilgileri" />
}

export function CustomerLocationPickerMap({
    latitude,
    longitude,
    googlePlaceId,
    placeLabel,
    onPick,
}: Props) {
    const [markerRef, marker] = useAdvancedMarkerRef()
    const [detailsOpen, setDetailsOpen] = useState(false)

    function applyManualPick(nextLatitude: number, nextLongitude: number) {
        setDetailsOpen(false)
        onPick(nextLatitude, nextLongitude)
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <Map
                mapId={googleMapsMapId}
                defaultCenter={latitude != null && longitude != null
                    ? { lat: latitude, lng: longitude }
                    : DEFAULT_CENTER}
                defaultZoom={latitude != null && longitude != null ? 15 : 5}
                style={{ width: "100%", height: 320 }}
                gestureHandling="cooperative"
                streetViewControl={false}
                mapTypeControl={false}
                fullscreenControl
                reuseMaps
                onClick={(event) => {
                    const point = event.detail.latLng
                    if (point) applyManualPick(point.lat, point.lng)
                }}
            >
                <SelectedLocationCamera latitude={latitude} longitude={longitude} />
                {latitude != null && longitude != null ? (
                    <AdvancedMarker
                        ref={markerRef}
                        position={{ lat: latitude, lng: longitude }}
                        draggable
                        clickable
                        title={placeLabel || "Seçili müşteri konumu"}
                        onClick={() => {
                            if (googlePlaceId) setDetailsOpen(true)
                        }}
                        onDragEnd={(event) => {
                            const point = event.latLng
                            if (point) applyManualPick(point.lat(), point.lng())
                        }}
                    >
                        <div className="relative flex items-end justify-center">
                            {googlePlaceId && placeLabel ? (
                                <span className="pointer-events-none absolute bottom-2 right-full mr-2 max-w-56 whitespace-nowrap rounded-md bg-white/95 px-2.5 py-1 text-sm font-semibold text-neutral-800 shadow-md ring-1 ring-black/10">
                                    {placeLabel}
                                </span>
                            ) : null}
                            <Pin background="#c88b20" borderColor="#8a5a0a" glyphColor="#ffffff" />
                        </div>
                    </AdvancedMarker>
                ) : null}

                {detailsOpen && googlePlaceId && marker ? (
                    <InfoWindow
                        anchor={marker}
                        shouldFocus={false}
                        onCloseClick={() => setDetailsOpen(false)}
                    >
                        <GooglePlaceDetails placeId={googlePlaceId} />
                    </InfoWindow>
                ) : null}
            </Map>
        </div>
    )
}
