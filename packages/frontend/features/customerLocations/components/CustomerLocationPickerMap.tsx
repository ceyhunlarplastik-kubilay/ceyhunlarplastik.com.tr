"use client"

import { useEffect, useState } from "react"
import { GeolocateControl, Map, Marker, NavigationControl } from "react-map-gl/maplibre"
import type { MarkerDragEvent } from "react-map-gl/maplibre"
// Eskiden root layout'ta globaldi; artık yalnızca harita içeren sayfalarda yüklenir.
import "maplibre-gl/dist/maplibre-gl.css"

type Props = {
    latitude?: number | null
    longitude?: number | null
    onPick: (latitude: number, longitude: number) => void
}

const DEFAULT_VIEW_STATE = {
    latitude: 39.1,
    longitude: 35.15,
    zoom: 5.25,
}

export function CustomerLocationPickerMap({
    latitude,
    longitude,
    onPick,
}: Props) {
    const [viewState, setViewState] = useState({
        ...DEFAULT_VIEW_STATE,
        ...(latitude != null && longitude != null
            ? { latitude, longitude, zoom: 14 }
            : {}),
    })

    useEffect(() => {
        if (latitude == null || longitude == null) return
        setViewState((current) => ({
            ...current,
            latitude,
            longitude,
            zoom: current.zoom < 13 ? 14 : current.zoom,
        }))
    }, [latitude, longitude])

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <Map
                {...viewState}
                onMove={(event) => setViewState(event.viewState)}
                onClick={(event) => onPick(event.lngLat.lat, event.lngLat.lng)}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                style={{ width: "100%", height: 320 }}
            >
                <NavigationControl position="top-right" showCompass={false} />
                <GeolocateControl
                    position="top-right"
                    trackUserLocation={false}
                    onGeolocate={(event) => onPick(event.coords.latitude, event.coords.longitude)}
                />
                {latitude != null && longitude != null ? (
                    <Marker
                        latitude={latitude}
                        longitude={longitude}
                        color="#c88b20"
                        draggable
                        onDragEnd={(event: MarkerDragEvent) => onPick(event.lngLat.lat, event.lngLat.lng)}
                    />
                ) : null}
            </Map>
        </div>
    )
}
