import { describe, expect, it } from "vitest"
import { buildGoogleMapsMultiStopDirectionsUrl } from "@/features/customerLocations/lib/buildGoogleMapsMultiStopDirectionsUrl"

describe("buildGoogleMapsMultiStopDirectionsUrl", () => {
    const origin = { lat: 41.0082, lng: 28.9784 }
    const destination = { lat: 40.9909, lng: 29.0247 }

    it("includes origin, destination and pipe-separated waypoints in order", () => {
        const url = buildGoogleMapsMultiStopDirectionsUrl(origin, destination, [
            { lat: 41.01, lng: 28.98 },
            { lat: 40.995, lng: 29.0 },
        ])

        expect(url).toBe(
            "https://www.google.com/maps/dir/?api=1&origin=41.0082%2C28.9784"
            + "&destination=40.9909%2C29.0247&travelmode=driving"
            + "&waypoints=41.01%2C28.98%7C40.995%2C29",
        )
    })

    it("omits the waypoints param when there are no stops", () => {
        const url = buildGoogleMapsMultiStopDirectionsUrl(origin, destination, [])

        expect(url).not.toContain("waypoints")
    })
})
