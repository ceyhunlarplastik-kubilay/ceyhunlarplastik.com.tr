type VariantMeasurement = {
    id: string
    value: number
    label: string
    measurementType: {
        id: string
        name: string
        code: string
        baseUnit: string
        displayOrder: number
    }
}

function normalizeNumeric(value: number): string {
    if (!Number.isFinite(value)) return String(value)
    return Number.parseFloat(value.toFixed(6)).toString()
}

export function formatMeasurementValue(measurement: VariantMeasurement): string {
    const code = measurement.measurementType.code
    const label = measurement.label?.trim()

    if ((code === "D" || code === "M") && label) {
        return label.toUpperCase().startsWith("M") ? label.toUpperCase() : `M${label}`
    }

    if (label) return label
    return normalizeNumeric(measurement.value)
}

export function buildMeasurementKey(measurements: VariantMeasurement[]): string {
    return [...measurements]
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map(
            (measurement) =>
                `${measurement.measurementType.id}:${normalizeNumeric(measurement.value)}`
        )
        .join("|")
}

export function toMeasurementLabel(measurements: VariantMeasurement[]): string {
    return [...measurements]
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map(
            (measurement) =>
                `${measurement.measurementType.name} (${measurement.measurementType.code}): ${formatMeasurementValue(measurement)}`
        )
        .join(" · ")
}
