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

export function mapAsset(asset: any) {
    return {
        id: asset.id,
        key: asset.key,
        mimeType: asset.mimeType,
        type: asset.type,
        role: asset.role,
        url: buildAssetUrl(asset.key),
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

// Usage değerlerini isim/slug + attribute künyesine indirger: public tablo yalnız
// name, admin formu yalnız *ValueId okur. Derin attribute/parentValue zincirleri
// yanıt boyutunu ürün başına ~0.5MB'a şişirip Lambda 6MB limitini aşıyordu.
function mapIndustrialUsageValue(value: any) {
    if (!value) return null

    return {
        id: value.id,
        name: value.name,
        slug: value.slug,
        attribute: value.attribute
            ? {
                id: value.attribute.id,
                code: value.attribute.code,
                name: value.attribute.name,
            }
            : null,
    }
}

function mapIndustrialUsage(usage: any) {
    return {
        id: usage.id,
        productId: usage.productId,
        sectorValueId: usage.sectorValueId ?? null,
        sectorValue: mapIndustrialUsageValue(usage.sectorValue),
        productionGroupValueId: usage.productionGroupValueId ?? null,
        productionGroupValue: mapIndustrialUsageValue(usage.productionGroupValue),
        usageAreaValueId: usage.usageAreaValueId ?? null,
        usageAreaValue: mapIndustrialUsageValue(usage.usageAreaValue),
        usageFunction: usage.usageFunction ?? null,
        imageKey: usage.imageKey ?? null,
        imageUrl: usage.imageKey ? buildAssetUrl(usage.imageKey) : null,
        displayOrder: usage.displayOrder ?? 0,
        createdAt: usage.createdAt,
        updatedAt: usage.updatedAt,
    }
}

export function mapProductWithAssets(product: any) {

    const assets = product.assets?.map(mapAsset) ?? []
    const primary = assets.find((a: any) => a.role === AssetRole.PRIMARY)
    const animation = assets.find((a: any) => a.role === AssetRole.ANIMATION)
    const gallery = assets.filter((a: any) => a.role === AssetRole.GALLERY)
    const documents = assets.filter((a: any) => a.role === AssetRole.DOCUMENT)
    const technicalDrawings = assets.filter((a: any) => a.role === AssetRole.TECHNICAL_DRAWING)

    return {
        id: product.id,
        code: product.code,
        name: product.name,
        slug: product.slug,
        description: product.description ?? null,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,

        category: product.category,

        assets,

        // primaryImage: primary?.url ?? null,
        //  animationImage: animation?.url ?? null,

        // galleryImages: gallery,
        // documents,
        // technicalDrawings,

        attributeValues: enrichHierarchyAttributeValues(product.attributeValues ?? []).filter(
            (value) => !INDUSTRIAL_ATTRIBUTE_CODE_SET.has(value.attribute?.code ?? ""),
        ),
        industrialUsages: (product.industrialUsages ?? []).map(mapIndustrialUsage),
    }
}
