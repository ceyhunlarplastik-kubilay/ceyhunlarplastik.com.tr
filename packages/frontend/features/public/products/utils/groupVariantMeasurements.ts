import {
    buildMeasurementKey,
    toMeasurementLabel,
} from "@/features/public/products/utils/measurement"
import { decimalLikeToNumber, decimalLikeToText } from "@/features/public/products/utils/decimalLike"
import type {
    VariantColor,
    VariantMaterial,
    VariantMeasurement,
    VariantTableData,
} from "@/features/public/products/components/ProductVariantTable"

// F1.2: Eskiden `ProductVariantTable` (client) içinde `useMemo` ile yapılan
// ölçü-grubu gruplaması buraya (server-safe, saf) taşındı. RSC sayfa ham varyant
// satırlarını burada gruplayıp component'e yalnızca gruplanmış option'ları
// (satır değil) prop olarak geçer → tarayıcıya inen payload ~500 satırdan grup
// sayısına düşer. Mantık birebir korundu (dedup "ilk kazanır", min fiyat, sıralama).
export type GroupedMeasurementOption = {
    key: string
    label: string
    measurements: VariantMeasurement[]
    colors: VariantColor[]
    materials: VariantMaterial[]
    suppliers: Array<{
        supplierId: string
        supplierName: string
        priceText: string
        currency: string
        isActive: boolean
    }>
    minPrice?: {
        value: number
        currency: string
    }
    fullCodes: string[]
}

export function groupVariantMeasurements(
    variants: VariantTableData[],
): GroupedMeasurementOption[] {
    const groups = new Map<string, GroupedMeasurementOption>()

    for (const variant of variants) {
        const key = buildMeasurementKey(variant.measurements)
        const existing = groups.get(key)

        if (!existing) {
            groups.set(key, {
                key,
                label: toMeasurementLabel(variant.measurements),
                measurements: [...variant.measurements].sort(
                    (a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder,
                ),
                colors: variant.color ? [variant.color] : [],
                materials: [...variant.materials],
                suppliers: (variant.variantSuppliers ?? []).map((item) => ({
                    supplierId: item.supplier.id,
                    supplierName: item.supplier.name,
                    priceText: decimalLikeToText(item.price),
                    currency: item.currency ?? "TRY",
                    isActive: Boolean(item.isActive),
                })),
                minPrice: (() => {
                    const priced = (variant.variantSuppliers ?? [])
                        .map((item) => ({
                            value: decimalLikeToNumber(item.price),
                            currency: item.currency ?? "TRY",
                        }))
                        .filter((item): item is { value: number; currency: string } => item.value !== null)
                    if (!priced.length) return undefined
                    return priced.reduce((min, cur) => (cur.value < min.value ? cur : min))
                })(),
                fullCodes: [variant.fullCode],
            })
            continue
        }

        if (variant.color && !existing.colors.find((color) => color.id === variant.color?.id)) {
            existing.colors.push(variant.color)
        }

        for (const material of variant.materials) {
            if (!existing.materials.find((item) => item.id === material.id)) {
                existing.materials.push(material)
            }
        }

        for (const supplier of variant.variantSuppliers ?? []) {
            const next = {
                supplierId: supplier.supplier.id,
                supplierName: supplier.supplier.name,
                priceText: decimalLikeToText(supplier.price),
                currency: supplier.currency ?? "TRY",
                isActive: Boolean(supplier.isActive),
            }
            const exists = existing.suppliers.find(
                (item) =>
                    item.supplierId === next.supplierId &&
                    item.priceText === next.priceText &&
                    item.currency === next.currency,
            )
            if (!exists) {
                existing.suppliers.push(next)
            }
        }

        const allPriced = existing.suppliers
            .map((item) => ({
                value: Number(item.priceText),
                currency: item.currency,
            }))
            .filter((item) => Number.isFinite(item.value))

        if (allPriced.length > 0) {
            existing.minPrice = allPriced.reduce((min, cur) =>
                cur.value < min.value ? cur : min,
            )
        }

        if (!existing.fullCodes.includes(variant.fullCode)) {
            existing.fullCodes.push(variant.fullCode)
        }
    }

    return Array.from(groups.values()).sort((a, b) => {
        const aFirst = a.measurements[0]?.value ?? 0
        const bFirst = b.measurements[0]?.value ?? 0
        return aFirst - bFirst
    })
}
