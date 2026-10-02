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
 * Ölçü kaydının değerleri, taslak satırın ölçü alanlarına konacak METİN olarak.
 * Bileşik girişte ("10*30", "10/30") birebir metin geri konur; aksi halde `value`
 * yalnız sıralama sürrogatı olduğundan "10" görünürdü.
 */
export function draftMeasurementsFromSize(size: MatrixSize | undefined): Record<string, string> {
    const measurements: Record<string, string> = {}
    for (const value of size?.values ?? []) {
        measurements[value.requirementId] = value.rawValue ?? String(value.value)
    }
    return measurements
}

/**
 * Bir tedarikçi bağlantısının taslağa taşınan ticari ve lojistik alanları — fiyat, MOQ,
 * logo, koli, termin. Tedarikçinin kendi ürün kodu (`supplierVariantCode`) BURADA YOK:
 * o koda özgüdür; kullanan yer bilerek ekler.
 */
export function draftCommercialFieldsFromSupplier(
    supplier: MatrixRowSupplier | undefined,
): Partial<VariantMatrixDraftRow> {
    return {
        hasSupplierLogo: supplier?.hasSupplierLogo ?? false,
        price: decimalLikeToText(supplier?.price) || undefined,
        minOrderQty: supplier?.minOrderQty != null ? String(supplier.minOrderQty) : undefined,
        unitsPerPackage: supplier?.unitsPerPackage != null ? String(supplier.unitsPerPackage) : undefined,
        packageLengthMm: decimalLikeToText(supplier?.packageLengthMm) || undefined,
        packageWidthMm: decimalLikeToText(supplier?.packageWidthMm) || undefined,
        packageHeightMm: decimalLikeToText(supplier?.packageHeightMm) || undefined,
        packageWeightKg: decimalLikeToText(supplier?.packageWeightKg) || undefined,
        minLeadTimeDays: supplier?.minLeadTimeDays != null ? String(supplier.minLeadTimeDays) : undefined,
    }
}

/**
 * Kayıtlı bir satırı TASLAK satıra çevirir.
 *
 * Amaç: katalogda birbirine çok benzeyen satırları hızlı girmek. Operatör mevcut
 * bir satırı kopyalayıp yalnız değişen ölçüyü düzeltiyor — sıfırdan renk, hammadde,
 * tedarikçi ve koli bilgisini yeniden seçmesi gerekmiyor.
 *
 * `supplier` verilirse o tedarikçinin ticari alanları da taşınır; `null` tedarikçisiz
 * taslak demektir; verilmezse satırın ilk tedarikçisi kullanılır.
 */
export function buildDraftFromRow(input: {
    row: MatrixRow
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    supplier?: MatrixRowSupplier | null
}): VariantMatrixDraftRow {
    const { row, sizes, versions } = input

    const size = sizes.find((entry) => entry.id === row.sizeId)
    const version = versions.find((entry) => entry.id === row.versionId)
    const supplier = input.supplier === null ? undefined : input.supplier ?? row.suppliers[0]

    return createEmptyDraftRow({
        measurements: draftMeasurementsFromSize(size),
        // Kopyalanan satır aynı VERSİYONU taşır; renk/hammadde artık satırda
        // değil sözlükte yaşıyor.
        versionId: version?.id,
        supplierId: supplier?.supplierId,
        supplierVariantCode: supplier?.supplierVariantCode ?? undefined,
        ...draftCommercialFieldsFromSupplier(supplier),
    })
}
