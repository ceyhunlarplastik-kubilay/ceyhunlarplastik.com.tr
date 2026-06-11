import type { CustomerVariantSpecialPrice } from "@/features/admin/customers/api/types"

export function formatPortalSpecialPriceDate(value?: string | null) {
    if (!value) return "Süresiz"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Süresiz"
    return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}

export function formatPortalPaymentTerm(days?: number | null, label?: string | null) {
    if (label) return label
    if (days === 0) return "Peşin"
    if (days === null || days === undefined) return "Vade belirtilmedi"
    return `${days} Gün`
}

export function formatPortalPaymentSchedule(item: CustomerVariantSpecialPrice) {
    if (!item.paymentSchedule?.length) return formatPortalPaymentTerm(item.paymentTermDays, item.paymentTermLabel)

    return item.paymentSchedule
        .map((step) => `%${step.percentage.toLocaleString("tr-TR", {
            maximumFractionDigits: 2,
        })} ${step.label}`)
        .join(" + ")
}

export function getPortalSpecialPriceProductImageUrl(item: CustomerVariantSpecialPrice) {
    const productAssets = item.productVariant?.product?.assets ?? []
    return productAssets.find((asset) => asset.role === "PRIMARY")?.url
        ?? productAssets.find((asset) => asset.type === "IMAGE")?.url
        ?? "/placeholder.webp"
}

export function buildPortalSpecialPriceVariantKey(item: CustomerVariantSpecialPrice) {
    return (item.productVariant?.measurements ?? [])
        .map((measurement) => `${measurement.measurementType.code}:${measurement.value}`)
        .join("|")
}

export function formatPortalSpecialPriceMeasurements(item: CustomerVariantSpecialPrice) {
    const measurements = item.productVariant?.measurements ?? []
    if (measurements.length === 0) return "Ölçü bilgisi yok"

    return measurements
        .map((measurement) => {
            const unit = measurement.measurementType.baseUnit ? ` ${measurement.measurementType.baseUnit}` : ""
            return `${measurement.measurementType.code}: ${measurement.value}${unit}`
        })
        .join(" / ")
}
