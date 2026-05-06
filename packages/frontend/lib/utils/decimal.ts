type DecimalLikeObject = {
    s?: number
    e?: number
    d?: number[]
}

export type DecimalLike = number | string | DecimalLikeObject | null | undefined

function decimalObjectToString(value: DecimalLikeObject) {
    const sign = value.s === -1 ? "-" : ""
    const chunks = Array.isArray(value.d) ? value.d : []
    const exponent = typeof value.e === "number" ? value.e : undefined

    if (!chunks.length || exponent === undefined) return ""

    const digits = chunks
        .map((chunk, index) => (index === 0 ? String(chunk) : String(chunk).padStart(7, "0")))
        .join("")

    const decimalIndex = exponent + 1

    if (decimalIndex <= 0) {
        return `${sign}0.${"0".repeat(Math.abs(decimalIndex))}${digits}`.replace(/\.?0+$/, (match) =>
            match.startsWith(".") ? "" : match
        )
    }

    if (decimalIndex >= digits.length) {
        return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`
    }

    return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`
}

export function decimalLikeToString(value: DecimalLike) {
    if (value === null || value === undefined) return ""
    if (typeof value === "string" || typeof value === "number") return String(value)
    return decimalObjectToString(value)
}

export function decimalLikeToFixedText(value: DecimalLike, fractionDigits = 2) {
    if (value === null || value === undefined || value === "") return "-"

    const asString = decimalLikeToString(value)
    const parsed = Number(asString)
    if (!Number.isFinite(parsed)) return asString || "-"
    return parsed.toFixed(fractionDigits)
}
