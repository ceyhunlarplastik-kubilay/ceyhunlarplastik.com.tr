import type { MatrixRequirement, SaveVariantMatrixRowInput } from "@/features/admin/productVariantMatrix/api/types"
import {
    parseMeasurementValue,
    parseOptionalInteger,
    parseOptionalNumber,
    type VariantMatrixDraftRow,
} from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"

export type DraftRowValidation = {
    index: number
    message: string
}

/**
 * Taslak satırları API gövdesine çevirir; çeviremediklerini hata olarak döner.
 *
 * Varyant ADI otomatik üretilir: "<ürün adı> <ölçüler>". Operatörden ayrıca ad
 * istemek gereksiz — ad zaten ölçü + renk/hammadde bileşiminden okunuyor.
 */
export function buildSaveRows(input: {
    rows: VariantMatrixDraftRow[]
    requirements: MatrixRequirement[]
    productName: string
}): { rows: SaveVariantMatrixRowInput[]; errors: DraftRowValidation[] } {
    const { rows, requirements, productName } = input

    const result: SaveVariantMatrixRowInput[] = []
    const errors: DraftRowValidation[] = []

    rows.forEach((row, index) => {
        const measurements: Array<{ requirementId: string; value: number }> = []
        const labelParts: string[] = []

        for (const requirement of requirements) {
            const raw = row.measurements[requirement.id] ?? ""
            const parsed = parseMeasurementValue(raw, requirement.measurementCode)

            if (parsed === null) {
                if (requirement.isRequired) {
                    errors.push({ index, message: `"${requirement.label}" değeri geçersiz veya boş` })
                }
                continue
            }

            measurements.push({ requirementId: requirement.id, value: parsed })
            labelParts.push(`${requirement.label} ${raw.trim()}${requirement.unit ? ` ${requirement.unit}` : ""}`)
        }

        if (measurements.length === 0) {
            errors.push({ index, message: "En az bir ölçü girilmeli" })
            return
        }

        result.push({
            name: [productName, labelParts.join(" · ")].filter(Boolean).join(" — ").slice(0, 240),
            measurements,
            colorId: row.colorId || undefined,
            materialIds: row.materialIds.length > 0 ? row.materialIds : undefined,
            supplier: row.supplierId
                ? {
                    supplierId: row.supplierId,
                    isActive: true,
                    price: parseOptionalNumber(row.price),
                    supplierVariantCode: row.supplierVariantCode?.trim() || undefined,
                    hasSupplierLogo: row.hasSupplierLogo,
                    minOrderQty: parseOptionalInteger(row.minOrderQty),
                    unitsPerPackage: parseOptionalInteger(row.unitsPerPackage),
                    packageLengthMm: parseOptionalNumber(row.packageLengthMm),
                    packageWidthMm: parseOptionalNumber(row.packageWidthMm),
                    packageHeightMm: parseOptionalNumber(row.packageHeightMm),
                    packageWeightKg: parseOptionalNumber(row.packageWeightKg),
                    minLeadTimeDays: parseOptionalInteger(row.minLeadTimeDays),
                }
                : undefined,
        })
    })

    return { rows: result, errors }
}
