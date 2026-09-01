"use client"

import { useEffect, useState } from "react"
import {
    AdvancedMarker,
    InfoWindow,
    Map,
    Pin,
    useAdvancedMarkerRef,
    useMap,
} from "@vis.gl/react-google-maps"
import { googleMapsMapId } from "@/features/customerLocations/components/GoogleMapsApiProvider"
import { GooglePlaceDetailsCard } from "@/features/customerLocations/components/GooglePlaceDetailsCard"

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
                        <GooglePlaceDetailsCard
                            placeId={googlePlaceId}
                            widthCss="min(360px, calc(100vw - 112px))"
                        />
                    </InfoWindow>
                ) : null}
            </Map>
        </div>
    )
}
