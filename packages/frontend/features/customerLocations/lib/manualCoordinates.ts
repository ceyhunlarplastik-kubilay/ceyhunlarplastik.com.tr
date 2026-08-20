function toCoordinateNumber(value: unknown) {
    if (typeof value === "number") return value
    if (typeof value !== "string") return Number.NaN

    // `Number("")` 0 döndürür: boş alan sessizce (0, 0) koordinatına dönüşmesin.
    const trimmed = value.trim()
    if (!trimmed) return Number.NaN

    return Number(trimmed.replace(",", "."))
}

export function normalizeCoordinateValue(
    value: unknown,
    minimum: number,
    maximum: number,
) {
    const coordinate = toCoordinateNumber(value)

    return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
        ? coordinate
        : null
}

export function parseManualCoordinates(latitudeText: string, longitudeText: string) {
    const latitude = normalizeCoordinateValue(latitudeText, -90, 90)
    const longitude = normalizeCoordinateValue(longitudeText, -180, 180)

    if (latitude === null) {
        return { success: false as const, message: "Enlem -90 ile 90 arasında olmalı." }
    }
    if (longitude === null) {
        return { success: false as const, message: "Boylam -180 ile 180 arasında olmalı." }
    }

    return { success: true as const, latitude, longitude }
}
