import { z } from "zod"

import { parseMeasurementInput } from "@core/helpers/productVariants/measurementValue"

/**
 * Matris taslak satırı. Ölçü değerleri METİN olarak tutulur: operatör "M4" veya
 * "12,5" yazabilir; sayıya çevirme `parseMeasurementValue` ile yapılır (core'daki
 * `parseMeasurementInput` ile aynı kuralları uygular).
 */
export const variantMatrixDraftRowSchema = z.object({
    measurements: z.record(z.string(), z.string()),
    /**
     * Ürün modelinin versiyon SÖZLÜĞÜNDEN seçilen kayıt (V1, V2…).
     *
     * Öncesinde satırda renk ve hammadde AYRI AYRI seçiliyordu; operatör
     * sözlükte tanımlı kombinasyonu elle yeniden kurmak zorunda kalıyordu ve
     * tanımsız bir kombinasyon seçerse kayıt sunucuda reddediliyordu. Artık
     * yalnız tanımlı versiyonlar seçilebiliyor, yani o hata sınıfı ortadan
     * kalktı. Renk/hammadde kaydetme anında sözlükten türetilir.
     */
    versionId: z.string().optional(),
    supplierId: z.string().optional(),
    supplierVariantCode: z.string().max(120).optional(),
    hasSupplierLogo: z.boolean().default(false),
    price: z.string().optional(),
    minOrderQty: z.string().optional(),
    unitsPerPackage: z.string().optional(),
    packageLengthMm: z.string().optional(),
    packageWidthMm: z.string().optional(),
    packageHeightMm: z.string().optional(),
    packageWeightKg: z.string().optional(),
    minLeadTimeDays: z.string().optional(),
})

export type VariantMatrixDraftRow = z.infer<typeof variantMatrixDraftRowSchema>

export function createEmptyDraftRow(defaults?: Partial<VariantMatrixDraftRow>): VariantMatrixDraftRow {
    return {
        measurements: {},
        versionId: undefined,
        supplierId: undefined,
        supplierVariantCode: undefined,
        hasSupplierLogo: false,
        price: undefined,
        minOrderQty: undefined,
        unitsPerPackage: undefined,
        packageLengthMm: undefined,
        packageWidthMm: undefined,
        packageHeightMm: undefined,
        packageWeightKg: undefined,
        minLeadTimeDays: undefined,
        ...defaults,
    }
}

/**
 * Ölçü girdisini sayıya çevirir.
 *
 * Uygulama CORE'daki `parseMeasurementInput`'tur — burada YENİDEN YAZILMAZ. Kısa
 * süre iki kopya vardı ve ondalık ayırıcıyı farklı normalize ediyorlardı; aynı
 * girdi operatörde ve sunucuda farklı değere çözülüyordu. Tek kaynak core'da,
 * frontend `@core/*` alias'ıyla erişir (bkz. CLAUDE.md).
 */
export function parseMeasurementValue(raw: string, measurementCode: string): number | null {
    return parseMeasurementInput(raw, measurementCode)?.value ?? null
}

export function parseOptionalNumber(raw: string | undefined): number | undefined {
    if (!raw?.trim()) return undefined
    const parsed = Number(raw.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
}

export function parseOptionalInteger(raw: string | undefined): number | undefined {
    const parsed = parseOptionalNumber(raw)
    return parsed === undefined ? undefined : Math.round(parsed)
}
