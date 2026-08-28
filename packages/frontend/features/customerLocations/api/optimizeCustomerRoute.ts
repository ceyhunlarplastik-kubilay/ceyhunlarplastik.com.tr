import { protectedApiClient } from "@/lib/http/client"

type LatLng = { lat: number; lng: number }

export type OptimizeCustomerRouteRequest = {
    origin: LatLng
    destination: LatLng
    waypoints: Array<LatLng & { refId: string }>
}

type OptimizeCustomerRouteApiData = {
    orderedWaypoints: Array<LatLng & {
        refId: string
        legDistanceMeters: number
        legDurationSeconds: number
    }>
    finalLegDistanceMeters: number
    finalLegDurationSeconds: number
    totalDistanceMeters: number
    totalDurationSeconds: number
    encodedPolyline: string
}

type OptimizeCustomerRouteResponse = {
    statusCode: number
    payload: {
        data: OptimizeCustomerRouteApiData
    }
}

export async function optimizeCustomerRoute(body: OptimizeCustomerRouteRequest) {
    const response = await protectedApiClient.post<OptimizeCustomerRouteResponse>(
        "/sales/customers/route/optimize",
        body,
    )

    return response.data.payload.data
}
