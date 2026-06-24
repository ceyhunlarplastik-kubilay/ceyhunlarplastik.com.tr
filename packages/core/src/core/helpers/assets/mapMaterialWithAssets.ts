import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"
import { buildAssetUrl } from "./buildAssetUrl"

function mapAsset(asset: any) {
    return {
        id: asset.id,
        key: asset.key,
        mimeType: asset.mimeType,
        type: asset.type,
        role: asset.role,
        url: asset.url ?? buildAssetUrl(asset.key),
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
    }
}

export function mapMaterialWithAssets(material: any, options: { certificatesOnly?: boolean } = {}) {
    const assets = (material.assets ?? [])
        .filter((asset: any) =>
            options.certificatesOnly
                ? asset.type === AssetType.PDF && asset.role === AssetRole.CERTIFICATE
                : true,
        )
        .map(mapAsset)

    return {
        ...material,
        assets,
    }
}
