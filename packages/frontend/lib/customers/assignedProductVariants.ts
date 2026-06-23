import type { CustomerAssignedProduct } from "@/features/admin/customers/api/types"
import { formatMeasurementValue } from "@/features/public/products/utils/measurement"

type AssignedProductVariant = CustomerAssignedProduct["productVariant"] | null | undefined

export function getAssignedProductVariantImageUrl(variant: AssignedProductVariant) {
    const variantAssets = variant?.assets ?? []
    const productAssets = variant?.product?.assets ?? []

    return variantAssets.find((asset) => asset.role === "PRIMARY")?.url
        ?? variantAssets.find((asset) => asset.type === "IMAGE")?.url
        ?? productAssets.find((asset) => asset.role === "PRIMARY")?.url
        ?? productAssets.find((asset) => asset.type === "IMAGE")?.url
        ?? "/placeholder.webp"
}

export function formatAssignedProductVariantSummary(variant: AssignedProductVariant) {
    if (!variant) return "Varyant bilgisi yok"

    const color = variant.color?.name?.trim()
    const measurements = (variant.measurements ?? [])
        .slice(0, 3)
        .map((measurement) => {
            const normalizedMeasurement = {
                ...measurement,
                measurementType: {
                    ...measurement.measurementType,
                    baseUnit: measurement.measurementType.baseUnit ?? "",
                    displayOrder: measurement.measurementType.displayOrder ?? 0,
                },
            }

            return `${measurement.measurementType.code}: ${formatMeasurementValue(normalizedMeasurement)}`
        })
        .join(" / ")
    const materials = (variant.materials ?? [])
        .slice(0, 2)
        .map((material) => material.name)
        .join(", ")

    return [color, measurements, materials]
        .filter(Boolean)
        .join(" - ")
        || variant.name
        || "Varyant bilgisi yok"
}
