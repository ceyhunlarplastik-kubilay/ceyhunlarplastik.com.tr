export function buildGoogleMapsDirectionsUrl(latitude: number, longitude: number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}

export function buildGoogleMapsSearchUrl(latitude: number, longitude: number) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

