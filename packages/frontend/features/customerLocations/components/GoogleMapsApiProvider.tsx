"use client"

import type { ReactNode } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"

export const googleMapsBrowserApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ""
export const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ?? ""

export function GoogleMapsApiProvider({
    children,
    onError,
}: {
    children: ReactNode
    onError?: (error: unknown) => void
}) {
    return (
        <APIProvider
            apiKey={googleMapsBrowserApiKey}
            version="weekly"
            language="tr"
            region="TR"
            authReferrerPolicy="origin"
            onError={onError}
        >
            {children}
        </APIProvider>
    )
}
