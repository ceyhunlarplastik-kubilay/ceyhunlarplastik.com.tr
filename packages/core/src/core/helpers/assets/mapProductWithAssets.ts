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
import { AssetRole } from "@/prisma/generated/prisma/client"

function mapAsset(asset: any) {
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

        attributeValues: enrichHierarchyAttributeValues(product.attributeValues ?? []),
    }
}
