/// <reference types="google.maps" />

"use client"

import { useEffect, useRef } from "react"
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import {
    parseGooglePlaceAddress,
    type GooglePlaceAddressDraft,
} from "@/features/customerLocations/lib/googlePlaceAddress"

export type GooglePlaceSelection = {
    placeId: string
    latitude: number
    longitude: number
    displayName?: string
    phone?: string
    address?: GooglePlaceAddressDraft
}

type Props = {
    query: string
    requestId: number
    onSelect: (selection: GooglePlaceSelection) => void | Promise<void>
    onError: (message: string) => void
}

export function GooglePlacesSearch({ query, requestId, onSelect, onError }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const requestRef = useRef<google.maps.places.PlaceTextSearchRequestElement | null>(null)
    const map = useMap()
    const placesLibrary = useMapsLibrary("places")

    useEffect(() => {
        const container = containerRef.current
        if (!container || !placesLibrary) return

        const searchElement = new placesLibrary.PlaceSearchElement({
            selectable: true,
            truncationPreferred: true,
            orientation: "VERTICAL",
        })
        const requestElement = new placesLibrary.PlaceTextSearchRequestElement({
            maxResultCount: 5,
        })
        const contentElement = new placesLibrary.PlaceAllContentElement()

        const handleSelect = async (event: google.maps.places.PlaceSelectEvent) => {
            const place = event.place
            const location = place.location
            if (!place.id || !location) {
                onError("Seçilen Google sonucu koordinat içermiyor.")
                return
            }

            const position = location.toJSON()
            // UI Kit sonucu telefonu zaten taşıyorsa kullanılır. Telefonu ayrıca
            // fetchFields ile istemek Place Details Enterprise katmanını tetikler.
            const availablePhone = place.internationalPhoneNumber?.trim()
                || place.nationalPhoneNumber?.trim()
                || undefined
            let address: GooglePlaceAddressDraft | undefined
            let addressLookupFailed = false

            try {
                const details = await place.fetchFields({
                    fields: ["addressComponents", "formattedAddress"],
                })
                if (details.place.addressComponents || details.place.formattedAddress) {
                    address = parseGooglePlaceAddress(
                        details.place.addressComponents ?? [],
                        details.place.formattedAddress,
                    )
                }
            } catch {
                addressLookupFailed = true
            }

            await onSelect({
                placeId: place.id,
                latitude: position.lat,
                longitude: position.lng,
                displayName: place.displayName?.trim() || undefined,
                phone: availablePhone,
                address,
            })

            if (addressLookupFailed) {
                onError("Konum seçildi ancak Google adres alanları otomatik alınamadı. Alanları elle tamamlayabilirsiniz.")
            }

            if (place.viewport && map) {
                map.fitBounds(place.viewport, 56)
            } else {
                map?.setCenter(position)
                map?.setZoom(16)
            }
        }
        const handleError = () => onError("Google Places araması kullanılamıyor veya kota dolmuş olabilir.")
        const handleSelectEvent: EventListener = (event) => {
            handleSelect(event as google.maps.places.PlaceSelectEvent).catch(() => {
                onError("Google konumu seçilirken beklenmeyen bir hata oluştu.")
            })
        }

        searchElement.addEventListener("gmp-select", handleSelectEvent)
        searchElement.addEventListener("gmp-error", handleError)
        searchElement.append(contentElement, requestElement)
        container.replaceChildren(searchElement)
        requestRef.current = requestElement

        return () => {
            searchElement.removeEventListener("gmp-select", handleSelectEvent)
            searchElement.removeEventListener("gmp-error", handleError)
            requestRef.current = null
            container.replaceChildren()
        }
    }, [map, onError, onSelect, placesLibrary])

    useEffect(() => {
        const request = requestRef.current
        const normalized = query.trim()
        if (!request || !normalized) return

        request.locationBias = map?.getBounds() ?? map?.getCenter() ?? null
        request.textQuery = normalized
    }, [map, placesLibrary, query, requestId])

    return <div ref={containerRef} className="min-h-0 [&>gmp-place-search]:w-full" />
}
