"use client"

import { useEffect, useRef } from "react"
import { useMapsLibrary } from "@vis.gl/react-google-maps"

type Props = {
    placeId: string
    /** Google `PlaceDetailsCompactElement` yönü. */
    orientation?: "HORIZONTAL" | "VERTICAL"
    /** Kart genişliği (CSS değeri). */
    widthCss?: string
    className?: string
}

/**
 * Native Google "compact place details" kartı (fotoğraf, ad, puan, adres, yol
 * tarifi / Google Maps bağlantısı). `<GoogleMapsApiProvider>` (APIProvider)
 * içinde ve tercihen bir `InfoWindow` içinde kullanılır.
 *
 * Not: her render bir Place Details isteği tetikler (billable). Bu yüzden yalnız
 * kullanıcı bir konuma tıklayınca çizilir, toplu değil.
 */
export function GooglePlaceDetailsCard({
    placeId,
    orientation = "HORIZONTAL",
    widthCss = "min(340px, calc(100vw - 96px))",
    className,
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const placesLibrary = useMapsLibrary("places")

    useEffect(() => {
        const container = containerRef.current
        if (!container || !placesLibrary) return

        const detailsElement = new placesLibrary.PlaceDetailsCompactElement({
            orientation,
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

        detailsElement.style.width = widthCss
        detailsElement.addEventListener("gmp-error", handleError)
        detailsElement.append(requestElement, contentElement)
        container.replaceChildren(detailsElement)

        return () => {
            detailsElement.removeEventListener("gmp-error", handleError)
            container.replaceChildren()
        }
    }, [placeId, placesLibrary, orientation, widthCss])

    return (
        <div
            ref={containerRef}
            className={className ?? "min-h-16 min-w-60"}
            aria-label="Google işletme bilgileri"
        />
    )
}
