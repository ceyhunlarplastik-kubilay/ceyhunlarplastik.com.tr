import type { VariantTableData, VariantMeasurement } from "@/features/public/products/components/ProductVariantTable"
import type { CustomerVariantSpecialPrice } from "@/features/admin/customers/api/types"
import {
    mapSpecialPriceToPortalDraftPreview,
    resolvePortalDraftPricing,
    type ResolvedPortalDraftPricing,
    type PortalDraftSpecialPricePreview,
} from "@/features/customerPortal/pricing/portalDraftPricing"
import { resolveCustomerDiscountedPrice } from "@/lib/customers/pricing"
import { formatMeasurementValue } from "@/features/public/products/utils/measurement"
import { resolveMeasurementUnit } from "@core/helpers/productVariants/measurementDisplay"

/**
 * `CustomerPortalVariantDetailsTable` (tam varyant tablosu, /varyantlar sayfası)
 * ve `PortalVariantQuickActions` (Ürün sayfasındaki "Mevcut Varyant Kodları"
 * paneli, kompakt ikon butonlar) AYNI fiyat/mesaj hesaplarını kullanır — bu
 * dosya tek kaynak. İki yerde de kopyalanmasın diye buraya çıkarıldı.
 */

export const WHATSAPP_PHONE = "905530602946"

export type PortalVariantPricing = ResolvedPortalDraftPricing & {
    specialPrice: CustomerVariantSpecialPrice | undefined
    specialPricePreview: PortalDraftSpecialPricePreview | null
}

export function decimalLikeToText(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined,
) {
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

export function resolveMinListPrice(variant: VariantTableData) {
    const priced = (variant.variantSuppliers ?? [])
        .map((supplier) => ({
            value: Number(decimalLikeToText(supplier.listPrice)),
            currency: supplier.currency ?? "TRY",
            pricingUpdatedAt: supplier.pricingUpdatedAt ?? supplier.updatedAt ?? null,
        }))
        .filter((item) => Number.isFinite(item.value))

    if (priced.length === 0) return null
    return priced.reduce((min, current) => current.value < min.value ? current : min)
}

export function formatPriceDate(value: string | null | undefined) {
    if (!value) return "-"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export function toPriceBound(value: number) {
    return Number(value.toFixed(2))
}

export function resolveBasePricing(variant: VariantTableData, customerDiscountPercent?: number | null) {
    const minListPrice = resolveMinListPrice(variant)
    const discountedPricing = resolveCustomerDiscountedPrice(minListPrice?.value, customerDiscountPercent)

    return {
        listUnitPrice: minListPrice?.value ?? null,
        customerUnitPrice: discountedPricing?.customerUnitPrice ?? minListPrice?.value ?? null,
        appliedDiscountPercent: discountedPricing?.appliedDiscountPercent ?? 0,
        currency: minListPrice?.currency ?? "TRY",
        priceSource: discountedPricing && discountedPricing.appliedDiscountPercent > 0
            ? "CUSTOMER_GENERAL_DISCOUNT" as const
            : "LIST_PRICE" as const,
    }
}

export function resolvePortalPricing(params: {
    variant: VariantTableData
    quantity?: number
    customerDiscountPercent?: number | null
    campaignDiscountPercent?: number | null
    specialPrice?: CustomerVariantSpecialPrice
}): PortalVariantPricing {
    const { variant, quantity, customerDiscountPercent, campaignDiscountPercent, specialPrice } = params
    const minListPrice = resolveMinListPrice(variant)
    const specialPricePreview = mapSpecialPriceToPortalDraftPreview(specialPrice)
    const resolved = resolvePortalDraftPricing({
        quantity,
        listUnitPrice: specialPrice?.pricing.listPrice ?? minListPrice?.value ?? null,
        currency: minListPrice?.currency ?? specialPrice?.pricing.currency ?? specialPrice?.currency ?? "TRY",
        generalDiscountPercent: customerDiscountPercent,
        campaignDiscountPercent: campaignDiscountPercent ?? null,
        specialPrice: specialPricePreview,
    })

    return {
        ...resolved,
        specialPrice,
        specialPricePreview,
    }
}

export function formatVariantMeasurementsForMessage(variant: VariantTableData) {
    return variant.measurements
        .slice()
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map((measurement) => {
            const withUnit =
                resolveMeasurementUnit(measurement) ? ` ${resolveMeasurementUnit(measurement)}` : ""

            return `${measurement.measurementType.name} (${measurement.measurementType.code}): ${formatMeasurementValue(measurement)}${withUnit}`
        })
        .join(" / ")
}

/**
 * Sepet drawer'ının dar satırına sığması için etiketsiz, yalnız değer bazlı
 * özet — tam ölçü adı/kodu için variantFullCode ve tam sayfa tablo yeterli.
 */
export function buildCompactMeasurementSummary(variant: VariantTableData) {
    return variant.measurements
        .slice()
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map((measurement) => {
            const unit = resolveMeasurementUnit(measurement)
            return `${formatMeasurementValue(measurement)}${unit ? ` ${unit}` : ""}`
        })
        .join(" × ")
}

export function buildCompactMaterialSummary(variant: VariantTableData) {
    return variant.materials
        .map((material) => material.code ? `${material.name} (${material.code})` : material.name)
        .join(", ")
}

export function buildWhatsappPriceRequestUrl(params: {
    variant: VariantTableData
    productName: string
    productCode: string
    categoryName?: string
    selectedMeasurements: VariantMeasurement[]
    currentUrl: string
}) {
    const { variant, productName, productCode, categoryName, selectedMeasurements, currentUrl } = params
    const variantMeasurements = formatVariantMeasurementsForMessage(variant)
    const messageLines = [
        "Merhaba. Müşteri portalında incelediğim ürün için hızlı fiyat almak istiyorum.",
        categoryName ? `Kategori: ${categoryName}` : null,
        `Ürün Modeli: ${productName}`,
        `Katalog Kodu: ${productCode}`,
        variant.name ? `Varyant: ${variant.name}` : null,
        `Varyant Kodu: ${variant.fullCode}`,
        variant.versionCode ? `Versiyon: ${variant.versionCode}` : null,
        selectedMeasurements.length > 0 ? `Seçili Ölçü Grubu: ${selectedMeasurements.map((measurement) => `${measurement.measurementType.name} (${measurement.measurementType.code}): ${formatMeasurementValue(measurement)}`).join(" / ")}` : null,
        variantMeasurements ? `Varyant Ölçüleri: ${variantMeasurements}` : null,
        `Sayfa Linki: ${currentUrl}`,
    ].filter((line): line is string => Boolean(line))

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(messageLines.join("\n"))}`
}
