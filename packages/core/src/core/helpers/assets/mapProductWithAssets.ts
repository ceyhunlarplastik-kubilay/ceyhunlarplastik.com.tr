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
    }
}