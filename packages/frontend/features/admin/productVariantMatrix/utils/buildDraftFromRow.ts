import type {
    MatrixRow,
    MatrixSize,
    MatrixVersion,
    MatrixRowSupplier,
    DecimalLike,
} from "@/features/admin/productVariantMatrix/api/types"
import {
    createEmptyDraftRow,
    type VariantMatrixDraftRow,
} from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"

/** Prisma Decimal JSON'da {s,e,d} objesi olarak gelir; forma metin olarak konur. */
export function decimalLikeToText(value: DecimalLike | undefined): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return String(value)
    if (typeof value === "string") return value

    const digits = value.d.join("")
    const whole = digits.slice(0, value.e + 1) || "0"
    const fraction = digits.slice(value.e + 1)
    const parsed = Number(`${value.s < 0 ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`)
    return Number.isFinite(parsed) ? String(parsed) : ""
}

/**
 * Kayıtlı bir satırı TASLAK satıra çevirir.
 *
 * Amaç: katalogda birbirine çok benzeyen satırları hızlı girmek. Operatör mevcut
 * bir satırı kopyalayıp yalnız değişen ölçüyü düzeltiyor — sıfırdan renk, hammadde,
 * tedarikçi ve koli bilgisini yeniden seçmesi gerekmiyor.
 *
 * `supplier` verilirse o tedarikçinin ticari alanları da taşınır; verilmezse satırın
 * ilk tedarikçisi kullanılır.
 */
export function buildDraftFromRow(input: {
    row: MatrixRow
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    supplier?: MatrixRowSupplier
}): VariantMatrixDraftRow {
    const { row, sizes, versions } = input

    const size = sizes.find((entry) => entry.id === row.sizeId)
    const version = versions.find((entry) => entry.id === row.versionId)
    const supplier = input.supplier ?? row.suppliers[0]

    const measurements: Record<string, string> = {}
    for (const value of size?.values ?? []) {
        measurements[value.requirementId] = String(value.value)
    }

    return createEmptyDraftRow({
        measurements,
        // Kopyalanan satır aynı VERSİYONU taşır; renk/hammadde artık satırda
        // değil sözlükte yaşıyor.
        versionId: version?.id,
        supplierId: supplier?.supplierId,
        supplierVariantCode: supplier?.supplierVariantCode ?? undefined,
        hasSupplierLogo: supplier?.hasSupplierLogo ?? false,
        price: decimalLikeToText(supplier?.price) || undefined,
        minOrderQty: supplier?.minOrderQty != null ? String(supplier.minOrderQty) : undefined,
        unitsPerPackage: supplier?.unitsPerPackage != null ? String(supplier.unitsPerPackage) : undefined,
        packageLengthMm: decimalLikeToText(supplier?.packageLengthMm) || undefined,
        packageWidthMm: decimalLikeToText(supplier?.packageWidthMm) || undefined,
        packageHeightMm: decimalLikeToText(supplier?.packageHeightMm) || undefined,
        packageWeightKg: decimalLikeToText(supplier?.packageWeightKg) || undefined,
        minLeadTimeDays: supplier?.minLeadTimeDays != null ? String(supplier.minLeadTimeDays) : undefined,
    })
}
