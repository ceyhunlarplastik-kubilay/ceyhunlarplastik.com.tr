export function formatRouteDistance(meters: number) {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
    return `${Math.round(meters)} m`
}

export function formatRouteDuration(seconds: number) {
    const totalMinutes = Math.round(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours <= 0) return `${minutes} dk`
    return `${hours} sa ${minutes} dk`
}
