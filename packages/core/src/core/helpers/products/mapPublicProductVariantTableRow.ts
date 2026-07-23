import { mapAsset } from "@/core/helpers/assets/mapProductWithAssets"
import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"
import {
    localizeColor,
    localizeMaterial,
    localizeMeasurementType,
    withoutDictionaryTranslations,
} from "@/core/helpers/variantDictionaries/localizeVariantDictionary"

function mapVariantColor(color: any, locale: SupportedLocale) {
    if (!color) return null
    return withoutDictionaryTranslations(localizeColor(color, locale))
}

function mapVariantMaterial(material: any, locale: SupportedLocale) {
    const localized = withoutDictionaryTranslations(localizeMaterial(material, locale))

    return {
        id: localized.id,
        name: localized.name,
        code: localized.code ?? null,
        locale: localized.locale,
        resolvedLocale: localized.resolvedLocale,
        translationMissing: localized.translationMissing,
        assets: (material.assets ?? []).map(mapAsset),
    }
}

function mapVariantMeasurementType(measurementType: any, locale: SupportedLocale) {
    if (!measurementType) return null
    return withoutDictionaryTranslations(localizeMeasurementType(measurementType, locale))
}

/**
 * Varyant tablosu satırının ORTAK (hassas olmayan) yapısı: ölçü, renk, hammadde,
 * kodlar. Ne fiyat ne tedarikçi içerir — public ve customer DTO'ları bunu paylaşır.
 */
function mapVariantTableStructure(
    variant: any,
    locale: SupportedLocale = DEFAULT_LOCALE,
) {
    return {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        versionCode: variant.versionCode,
        supplierCode: variant.supplierCode,
        variantIndex: variant.variantIndex,
        fullCode: variant.fullCode,
        colorId: variant.colorId ?? null,
        color: mapVariantColor(variant.color, locale),
        materials: (variant.materials ?? []).map((material: any) =>
            mapVariantMaterial(material, locale),
        ),
        measurements: (variant.measurements ?? []).map((measurement: any) => ({
            id: measurement.id,
            value: measurement.value,
            label: measurement.label ?? "",
            measurementType: mapVariantMeasurementType(measurement.measurementType, locale),
        })),
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
    }
}

/**
 * PUBLIC varyant tablosu satırı (P1.8 B0).
 *
 * Fiyat ve tedarikçi bilgisi HİÇ taşınmaz — public kullanıcı bunları ne UI'da
 * ne network yanıtında görmemeli (iş kuralı + veri sızıntısı önlemi). Repository
 * `includeListPrice:false` ile çağrıldığından variantSuppliers zaten çekilmez;
 * bu mapper da onu döndürmez.
 */
export function mapPublicProductVariantTableRow(
    variant: any,
    locale: SupportedLocale = DEFAULT_LOCALE,
) {
    return mapVariantTableStructure(variant, locale)
}

/**
 * CUSTOMER varyant tablosu satırı (P1.8 B0).
 *
 * Public yapıya EK olarak yalnız liste fiyatı alanlarını taşır
 * (resolveMinListPrice'ın kullandığı): listPrice, currency, pricingUpdatedAt,
 * updatedAt. Tedarikçi kimliği (id/name) ve tedarikçi maliyeti (price/netCost/
 * profitRate/...) HİÇ taşınmaz — bunlar admin/sales'e özgüdür (bkz. B0-admin).
 * Yalnız ProtectedApi (giriş yapmış) endpoint'inden döner.
 */
export function mapCustomerProductVariantTableRow(
    variant: any,
    locale: SupportedLocale = DEFAULT_LOCALE,
) {
    return {
        ...mapVariantTableStructure(variant, locale),
        variantSuppliers: (variant.variantSuppliers ?? []).map((item: any) => ({
            listPrice: item.listPrice ?? null,
            currency: item.currency ?? null,
            pricingUpdatedAt: item.pricingUpdatedAt ?? null,
            updatedAt: item.updatedAt,
        })),
    }
}
