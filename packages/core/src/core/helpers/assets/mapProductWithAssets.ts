/* import { AssetRole } from "@/prisma/generated/prisma/client"

export function mapProductWithAssets(product: any) {

    const primary =
        product.assets?.find((a: any) => a.role === AssetRole.PRIMARY)

    const animation =
        product.assets?.find((a: any) => a.role === AssetRole.ANIMATION)

    const gallery =
        product.assets?.filter((a: any) => a.role === AssetRole.GALLERY)

    const documents =
        product.assets?.filter((a: any) => a.role === AssetRole.DOCUMENT)

    const technicalDrawings =
        product.assets?.filter((a: any) => a.role === AssetRole.TECHNICAL_DRAWING)

    return {
        ...product,

        primaryImage: primary?.url ?? null,
        animationImage: animation?.url ?? null,

        galleryImages: gallery ?? [],
        documents: documents ?? [],
        technicalDrawings: technicalDrawings ?? [],
    }
} */

import { buildAssetUrl } from "./buildAssetUrl"
import { INDUSTRIAL_ATTRIBUTE_CODE_SET } from "@/core/helpers/products/productIndustrialUsages"
import { AssetRole } from "@/prisma/generated/prisma/client"
import { localizeCategory } from "@/core/helpers/categories/localizeCategory"
import {
    localizeProductAttribute,
    localizeProductAttributeValue,
} from "@/core/helpers/productAttributes/localizeProductAttribute"
import { localizeProductIndustrialUsage } from "@/core/helpers/products/localizeProductIndustrialUsage"
import { localizeProduct } from "@/core/helpers/products/localizeProduct"
import { parseProductModel3dConfig } from "@/core/helpers/products/model3dConfig"
import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

export function mapAsset(asset: any) {
    const model3dConfig = asset.role === AssetRole.MODEL_3D
        ? parseProductModel3dConfig(asset.model3dConfig)
        : null

    return {
        id: asset.id,
        key: asset.key,
        mimeType: asset.mimeType,
        type: asset.type,
        role: asset.role,
        url: buildAssetUrl(asset.key),
        ...(model3dConfig ? { model3dConfig } : {}),
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
    }
}

function enrichHierarchyAttributeValues(attributeValues: any[]) {
    const result: any[] = []
    const seen = new Set<string>()

    const pushValue = (value: any) => {
        if (!value?.id || !value?.attribute?.code) return
        const key = `${value.attribute.code}:${value.id}`
        if (seen.has(key)) return
        seen.add(key)
        result.push(value)
    }

    for (const value of attributeValues ?? []) {
        pushValue(value)

        if (value?.attribute?.code === "production_group" && value?.parentValue) {
            pushValue(value.parentValue)
        }

        if (value?.attribute?.code === "usage_area" && value?.parentValue) {
            pushValue(value.parentValue)

            if (value.parentValue?.parentValue) {
                pushValue(value.parentValue.parentValue)
            }
        }
    }

    return result
}

function mapProductAttribute(attribute: any, locale: SupportedLocale) {
    if (!attribute) return null

    const localized = localizeProductAttribute(attribute, locale)
    const { translations: _translations, ...rest } = attribute

    return {
        ...rest,
        name: localized.name,
        locale: localized.locale,
        resolvedLocale: localized.resolvedLocale,
        translationMissing: localized.translationMissing,
    }
}

function mapIndustrialUsageAttribute(attribute: any, locale: SupportedLocale) {
    if (!attribute) return null

    const localized = localizeProductAttribute(attribute, locale)

    return {
        id: attribute.id,
        code: attribute.code,
        name: localized.name,
    }
}

function mapProductAttributeValue(value: any, locale: SupportedLocale): any {
    if (!value) return null

    const localized = localizeProductAttributeValue(value, locale)
    const { translations: _translations, ...rest } = value

    return {
        ...rest,
        name: localized.name,
        slug: localized.slug,
        locale: localized.locale,
        resolvedLocale: localized.resolvedLocale,
        translationMissing: localized.translationMissing,
        alternateSlugs: localized.alternateSlugs,
        attribute: mapProductAttribute(value.attribute, locale),
        parentValue: value.parentValue
            ? mapProductAttributeValue(value.parentValue, locale)
            : value.parentValue ?? null,
    }
}

// Usage değerlerini isim/slug + attribute künyesine indirger: public tablo yalnız
// name, admin formu yalnız *ValueId okur. Derin attribute/parentValue zincirleri
// yanıt boyutunu ürün başına ~0.5MB'a şişirip Lambda 6MB limitini aşıyordu.
function mapIndustrialUsageValue(
    value: any,
    locale: SupportedLocale,
    includeAdminTranslations: boolean,
) {
    if (!value) return null

    const localized = localizeProductAttributeValue(value, locale)

    return {
        id: value.id,
        name: localized.name,
        slug: localized.slug,
        locale: localized.locale,
        resolvedLocale: localized.resolvedLocale,
        translationMissing: localized.translationMissing,
        // `alternateSlugs` yalnız ÜRÜN ve KATEGORİ seviyesinde tüketilir
        // (canonical/hreflang). Kullanım satırının taksonomi değerinde hiçbir
        // yüzey okumaz; 224 satırda 384 KB ediyordu.
        ...(includeAdminTranslations && { alternateSlugs: localized.alternateSlugs }),
        attribute: mapIndustrialUsageAttribute(value.attribute, locale),
    }
}

function mapIndustrialUsage(
    usage: any,
    locale: SupportedLocale,
    includeAdminTranslations: boolean,
) {
    const localized = localizeProductIndustrialUsage(usage, locale)

    return {
        id: usage.id,
        productId: usage.productId,
        sectorValueId: usage.sectorValueId ?? null,
        sectorValue: mapIndustrialUsageValue(usage.sectorValue, locale, includeAdminTranslations),
        productionGroupValueId: usage.productionGroupValueId ?? null,
        productionGroupValue: mapIndustrialUsageValue(
            usage.productionGroupValue,
            locale,
            includeAdminTranslations,
        ),
        usageAreaValueId: usage.usageAreaValueId ?? null,
        usageAreaValue: mapIndustrialUsageValue(usage.usageAreaValue, locale, includeAdminTranslations),
        usageFunction: localized.usageFunction,
        locale: localized.locale,
        resolvedLocale: localized.resolvedLocale,
        translationMissing: localized.translationMissing,
        // Çeviri satırları YALNIZ admin formunu besler (locale'e özgü görsel
        // önizlemesi); public taraf çözümlenmiş imageKey/imageUrl'i okur.
        // 224 satırlı bir üründe bu dizi tek başına 1256 KB'dı.
        ...(includeAdminTranslations && {
            translations: localized.translations.map((translation) => ({
                ...translation,
                imageUrl: translation.imageKey ? buildAssetUrl(translation.imageKey) : null,
            })),
        }),
        // localized.imageKey = istenen locale'in görseli, yoksa varsayılan (TR).
        imageKey: localized.imageKey,
        imageUrl: localized.imageKey ? buildAssetUrl(localized.imageKey) : null,
        displayOrder: usage.displayOrder ?? 0,
        createdAt: usage.createdAt,
        updatedAt: usage.updatedAt,
    }
}

/**
 * Public yüzeylerde ADMIN'e özel alanlar taşınmaz.
 *
 * Ölçüm (prod, 224 kullanım satırlı ürün): HTML 2374 KB'ın 1945 KB'ı (%82)
 * `industrialUsages` dizisiydi; bunun 1256 KB'ı (%53) 14 dilin `translations`
 * satırları, 384 KB'ı (%16) taksonomi değerlerinin `alternateSlugs`'larıydı.
 * Public sayfa TEK dil render eder ve bu iki alanı hiç okumaz — `.translations`
 * public bileşenlerde hiç geçmez, `alternateSlugs` yalnız ÜRÜN ve KATEGORİ
 * seviyesinde (canonical/hreflang) tüketilir.
 *
 * Varsayılan `true`: admin ürün formu çeviri satırlarını (locale'e özgü görsel
 * önizlemesi dahil) okumaya devam eder. Yalnız PublicApi handler'ları `false` geçer.
 */
export type MapProductOptions = {
    includeAdminTranslations?: boolean
}

export function mapProductWithAssets(
    product: any,
    locale: SupportedLocale = DEFAULT_LOCALE,
    { includeAdminTranslations = true }: MapProductOptions = {},
) {
    const localized = localizeProduct(product, locale)

    const assets = product.assets?.map(mapAsset) ?? []
    const primary = assets.find((a: any) => a.role === AssetRole.PRIMARY)
    const animation = assets.find((a: any) => a.role === AssetRole.ANIMATION)
    const gallery = assets.filter((a: any) => a.role === AssetRole.GALLERY)
    const documents = assets.filter((a: any) => a.role === AssetRole.DOCUMENT)
    const technicalDrawings = assets.filter((a: any) => a.role === AssetRole.TECHNICAL_DRAWING)

    return {
        id: product.id,
        code: product.code,
        name: localized.name,
        slug: localized.slug,
        description: localized.description,
        // YouTube linkleri locale'den bağımsız: video her dilde ortak.
        assemblyVideoUrl: product.assemblyVideoUrl ?? null,
        promoVideoUrl: product.promoVideoUrl ?? null,
        locale: localized.locale,
        resolvedLocale: localized.resolvedLocale,
        translationMissing: localized.translationMissing,
        alternateSlugs: localized.alternateSlugs,
        ...(includeAdminTranslations && { translations: localized.translations }),
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,

        category: product.category
            ? localizeCategory(product.category, locale)
            : null,

        assets,

        // primaryImage: primary?.url ?? null,
        //  animationImage: animation?.url ?? null,

        // galleryImages: gallery,
        // documents,
        // technicalDrawings,

        attributeValues: enrichHierarchyAttributeValues(product.attributeValues ?? [])
            .map((value) => mapProductAttributeValue(value, locale))
            .filter((value) => !INDUSTRIAL_ATTRIBUTE_CODE_SET.has(value.attribute?.code ?? "")),
        industrialUsages: (product.industrialUsages ?? []).map((usage: any) =>
            mapIndustrialUsage(usage, locale, includeAdminTranslations)
        ),
    }
}
