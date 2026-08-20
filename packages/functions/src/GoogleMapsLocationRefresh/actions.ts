import { refreshExpiringGooglePlaceCoordinates } from "@/core/helpers/crm/googlePlacesCoordinateRefresh"

export async function handler() {
    const result = await refreshExpiringGooglePlaceCoordinates()
    console.info("Google Places coordinate refresh completed", result)
    return result
}
