import { buildAssetUrl } from "./buildAssetUrl"

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

export function mapCategoryWithAssets(category: any) {
    return {
        id: category.id,
        code: category.code,
        name: category.name,
        slug: category.slug,
        allowedAttributeValueIds: category.allowedAttributeValueIds ?? [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        assets: category.assets?.map(mapAsset) ?? [],
    }
}
