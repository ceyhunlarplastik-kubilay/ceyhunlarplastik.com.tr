import { mapAsset } from "@/core/helpers/assets/mapProductWithAssets"
import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"
import { formatVersionCode } from "@/core/helpers/productVariants/variantCode"
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
 * Ürün modeline özel ölçü etiketi ("Kol Çapı"). Locale çevirisi varsa o, yoksa
 * şablonun TR etiketi. Ölçü TİPİ adından (`measurementType.name`) farklıdır:
 * aynı `R` kodu bir modelde "Elcik Çapı", diğerinde "Kol Çapı" olabilir.
 */
function resolveRequirementLabel(requirement: any, locale: SupportedLocale): string {
    const translation = (requirement?.translations ?? []).find(
        (entry: any) => entry.locale === locale,
    )
    return translation?.label ?? requirement?.label ?? ""
}

/**
 * Varyant tablosu satırının ORTAK (hassas olmayan) yapısı: ölçü, renk, hammadde,
 * kodlar. Ne fiyat ne tedarikçi içerir — public ve customer DTO'ları bunu paylaşır.
 *
 * DTO ŞEKLİ BİLİNÇLİ OLARAK KORUNUYOR: veri modelinde ölçüler `size.values`,
 * renk/hammadde `version` altına taşındı, ama okuyan yüzeyler (public katalog,
 * portal, kampanya, özel fiyat) hâlâ düz `measurements` / `color` / `materials`
 * görür. Aksi hâlde ~50 dosya tek dilimde değişmek zorunda kalırdı.
 */
function mapVariantTableStructure(
    variant: any,
    locale: SupportedLocale = DEFAULT_LOCALE,
) {
    const sizeValues = variant.size?.values ?? []

    return {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        /// Kodun 3. segmenti — eski `variantIndex`'in yerini alır.
        sizeCode: variant.size?.code ?? null,
        versionCode: variant.version?.code ? formatVersionCode(variant.version.code) : null,
        fullCode: variant.fullCode,
        colorId: variant.version?.colorId ?? null,
        color: mapVariantColor(variant.version?.color, locale),
        materials: (variant.version?.materials ?? []).map((material: any) =>
            mapVariantMaterial(material, locale),
        ),
        measurements: sizeValues.map((sizeValue: any) => ({
            id: sizeValue.id,
            value: sizeValue.value,
            label: resolveRequirementLabel(sizeValue.requirement, locale),
            unit: sizeValue.requirement?.unit ?? sizeValue.requirement?.measurementType?.baseUnit ?? null,
            measurementType: mapVariantMeasurementType(sizeValue.requirement?.measurementType, locale),
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
 * updatedAt. Tedarikçi kimliği (id/name/harf) ve tedarikçi maliyeti (price/netCost/
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
