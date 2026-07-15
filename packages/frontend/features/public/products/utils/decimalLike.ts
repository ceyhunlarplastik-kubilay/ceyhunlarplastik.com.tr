// Prisma Decimal, apiResponseDTO üzerinden `{ s, e, d }` benzeri bir yapı olarak
// serialize olabilir (ISO string yerine). Bu saf yardımcılar hem number/string hem
// de bu Decimal-benzeri şekli okunur metne/sayıya çevirir.
//
// Not: Eskiden `ProductVariantTable` (client) içindeydi; F1.2 ile gruplama server
// katmanına taşınırken buraya (server-safe, "use client" YOK) çıkarıldı ki hem
// `groupVariantMeasurements` hem de gerekirse component aynı mantığı paylaşsın.

export type DecimalLike =
    | number
    | string
    | { s?: number; e?: number; d?: number[] }
    | null
    | undefined

export function decimalLikeToText(value: DecimalLike): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") return value

    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return ""

    if (exponent >= digits.length - 1) {
        return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    }
    if (exponent < 0) {
        return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    }
    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
}

export function decimalLikeToNumber(value: DecimalLike): number | null {
    const text = decimalLikeToText(value)
    if (!text || text === "-") return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
}
