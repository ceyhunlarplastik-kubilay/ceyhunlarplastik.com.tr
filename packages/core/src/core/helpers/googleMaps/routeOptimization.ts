/** Google yanıt vermezse Lambda çağrısını (ve API Gateway'i) bloke etmesin. */
export const GOOGLE_ROUTES_REQUEST_TIMEOUT_MS = 10_000

/** Google Routes API'nin computeRoutes uçtaki dokümante intermediate üst sınırı. */
export const GOOGLE_ROUTES_MAX_WAYPOINTS = 25

export class GoogleRoutesRequestError extends Error {
    readonly httpStatus: number
    readonly googleStatus: string | null
    readonly googleMessage: string | null

    constructor({
        httpStatus,
        googleStatus,
        googleMessage,
    }: {
        httpStatus: number
        googleStatus: string | null
        googleMessage: string | null
    }) {
        const description = googleMessage ? `: ${googleMessage}` : ""
        super(`Google Routes request failed (${httpStatus}${googleStatus ? ` ${googleStatus}` : ""}${description})`)
        this.name = "GoogleRoutesRequestError"
        this.httpStatus = httpStatus
        this.googleStatus = googleStatus
        this.googleMessage = googleMessage
    }
}

type GoogleErrorResponse = {
    error?: {
        status?: string
        message?: string
    }
}

type LatLng = { lat: number; lng: number }

export type RouteWaypoint = LatLng & { refId: string }

type ComputeRoutesResponse = {
    routes?: Array<{
        optimizedIntermediateWaypointIndex?: number[]
        distanceMeters?: number
        duration?: string
        polyline?: { encodedPolyline?: string }
        legs?: Array<{
            distanceMeters?: number
            duration?: string
        }>
    }>
}

export type OptimizedRouteLeg = {
    distanceMeters: number
    durationSeconds: number
}

export type OptimizedRoute = {
    /** Girdi sırasından bağımsız, Google'ın hesapladığı ziyaret sırası. */
    orderedWaypoints: RouteWaypoint[]
    /** origin → durak(0..n-1) → destination sırasıyla n+1 bacak. */
    legs: OptimizedRouteLeg[]
    totalDistanceMeters: number
    totalDurationSeconds: number
    encodedPolyline: string
}

function toLatLngLocation({ lat, lng }: LatLng) {
    return { location: { latLng: { latitude: lat, longitude: lng } } }
}

function parseDurationSeconds(value: string | undefined) {
    if (!value) return 0
    const parsed = Number.parseFloat(value.replace(/s$/, ""))
    return Number.isFinite(parsed) ? parsed : 0
}

function safeGoogleErrorText(value: unknown) {
    if (typeof value !== "string") return null
    const normalized = value.replace(/\s+/g, " ").trim()
    return normalized ? normalized.slice(0, 500) : null
}

/**
 * Başlangıç, bitiş ve serbest sırayla girilen durakları Google Routes API'ye
 * (`computeRoutes`, `optimizeWaypointOrder: true`) gönderip en uygun ziyaret
 * sırasını + toplam/bacak bazlı mesafe-süreyi döner.
 */
export async function optimizeCustomerRoute({
    origin,
    destination,
    waypoints,
    apiKey,
    fetcher = fetch,
}: {
    origin: LatLng
    destination: LatLng
    waypoints: RouteWaypoint[]
    apiKey: string
    fetcher?: typeof fetch
}): Promise<OptimizedRoute> {
    if (!apiKey?.trim()) {
        throw new Error("GOOGLE_MAPS_SERVER_API_KEY is not configured")
    }

    const response = await fetcher("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": [
                "routes.optimizedIntermediateWaypointIndex",
                "routes.distanceMeters",
                "routes.duration",
                "routes.polyline.encodedPolyline",
                "routes.legs.distanceMeters",
                "routes.legs.duration",
            ].join(","),
        },
        body: JSON.stringify({
            origin: toLatLngLocation(origin),
            destination: toLatLngLocation(destination),
            intermediates: waypoints.map((waypoint) => toLatLngLocation(waypoint)),
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            optimizeWaypointOrder: true,
        }),
        signal: AbortSignal.timeout(GOOGLE_ROUTES_REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
        let googleError: GoogleErrorResponse | null = null
        try {
            googleError = await response.json() as GoogleErrorResponse
        } catch {
            // Google JSON döndürmezse HTTP durumu yine tanı için yeterlidir.
        }

        throw new GoogleRoutesRequestError({
            httpStatus: response.status,
            googleStatus: safeGoogleErrorText(googleError?.error?.status),
            googleMessage: safeGoogleErrorText(googleError?.error?.message),
        })
    }

    const payload = await response.json() as ComputeRoutesResponse
    const route = payload.routes?.[0]
    if (!route) {
        throw new GoogleRoutesRequestError({
            httpStatus: response.status,
            googleStatus: "NO_ROUTE",
            googleMessage: "Google Routes API boş rota döndürdü.",
        })
    }

    const visitOrder = route.optimizedIntermediateWaypointIndex
        ?? waypoints.map((_, index) => index)
    const orderedWaypoints = visitOrder.map((originalIndex) => waypoints[originalIndex])

    const legs = (route.legs ?? []).map((leg) => ({
        distanceMeters: leg.distanceMeters ?? 0,
        durationSeconds: parseDurationSeconds(leg.duration),
    }))

    return {
        orderedWaypoints,
        legs,
        totalDistanceMeters: route.distanceMeters ?? 0,
        totalDurationSeconds: parseDurationSeconds(route.duration),
        encodedPolyline: route.polyline?.encodedPolyline ?? "",
    }
}
