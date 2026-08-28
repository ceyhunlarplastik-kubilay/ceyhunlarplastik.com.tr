export type RoutePointSource = "CURRENT_LOCATION" | "SEARCH" | "CUSTOMER_PIN"

export type RoutePoint = {
    refId: string
    lat: number
    lng: number
    label: string
    source: RoutePointSource
}

export type RouteStop = RoutePoint

export type OptimizedRouteStop = RouteStop & {
    order: number
    legDistanceMeters: number
    legDurationSeconds: number
}

export type OptimizedRouteResult = {
    orderedStops: OptimizedRouteStop[]
    finalLegDistanceMeters: number
    finalLegDurationSeconds: number
    totalDistanceMeters: number
    totalDurationSeconds: number
    encodedPolyline: string
}

export type RoutePickingTarget = "origin" | "destination" | null
