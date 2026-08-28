import { describe, expect, it, vi } from "vitest"
import { GoogleRoutesRequestError, optimizeCustomerRoute } from "@/core/helpers/googleMaps/routeOptimization"

describe("optimizeCustomerRoute", () => {
    const origin = { lat: 41.0, lng: 29.0 }
    const destination = { lat: 40.9, lng: 29.3 }
    const waypoints = [
        { refId: "a", lat: 41.05, lng: 29.05 },
        { refId: "b", lat: 40.95, lng: 29.1 },
        { refId: "c", lat: 40.98, lng: 29.2 },
    ]

    it("reorders waypoints per Google's optimizedIntermediateWaypointIndex and parses legs", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            routes: [{
                optimizedIntermediateWaypointIndex: [2, 0, 1],
                distanceMeters: 15000,
                duration: "1800s",
                polyline: { encodedPolyline: "encoded-polyline" },
                legs: [
                    { distanceMeters: 4000, duration: "500s" },
                    { distanceMeters: 5000, duration: "600s" },
                    { distanceMeters: 3000, duration: "400s" },
                    { distanceMeters: 3000, duration: "300s" },
                ],
            }],
        }), { status: 200 }))

        const result = await optimizeCustomerRoute({ origin, destination, waypoints, apiKey: "server-key", fetcher })

        expect(result.orderedWaypoints.map((waypoint) => waypoint.refId)).toEqual(["c", "a", "b"])
        expect(result.legs).toEqual([
            { distanceMeters: 4000, durationSeconds: 500 },
            { distanceMeters: 5000, durationSeconds: 600 },
            { distanceMeters: 3000, durationSeconds: 400 },
            { distanceMeters: 3000, durationSeconds: 300 },
        ])
        expect(result.totalDistanceMeters).toBe(15000)
        expect(result.totalDurationSeconds).toBe(1800)
        expect(result.encodedPolyline).toBe("encoded-polyline")

        expect(fetcher).toHaveBeenCalledWith(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ "X-Goog-Api-Key": "server-key" }),
            }),
        )
        const requestBody = JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string)
        expect(requestBody.optimizeWaypointOrder).toBe(true)
        expect(requestBody.intermediates).toHaveLength(3)
    })

    it("throws GoogleRoutesRequestError with Google's error details on non-2xx", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            error: { status: "INVALID_ARGUMENT", message: "Too many waypoints" },
        }), { status: 400 }))

        await expect(optimizeCustomerRoute({ origin, destination, waypoints, apiKey: "server-key", fetcher }))
            .rejects.toMatchObject({
                name: "GoogleRoutesRequestError",
                httpStatus: 400,
                googleStatus: "INVALID_ARGUMENT",
                googleMessage: "Too many waypoints",
            })
    })

    it("rejects when the API key is missing", async () => {
        await expect(optimizeCustomerRoute({ origin, destination, waypoints, apiKey: "" }))
            .rejects.toThrow("GOOGLE_MAPS_SERVER_API_KEY is not configured")
    })

    it("re-exports GoogleRoutesRequestError for handler-level catch blocks", () => {
        expect(new GoogleRoutesRequestError({ httpStatus: 500, googleStatus: null, googleMessage: null }).name)
            .toBe("GoogleRoutesRequestError")
    })
})
