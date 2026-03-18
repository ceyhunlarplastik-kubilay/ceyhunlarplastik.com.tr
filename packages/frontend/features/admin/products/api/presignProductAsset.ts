import { adminApiClient } from "@/lib/http/client"
import type { AssetRole } from "@/features/public/assets/types"
import type { PresignProductAssetResponse } from "./types"

type Params = {
    productSlug: string
    assetRole: AssetRole
    fileName: string
    contentType: string
}

export async function presignProductAsset({
    productSlug,
    assetRole,
    fileName,
    contentType,
}: Params): Promise<PresignProductAssetResponse["payload"]> {
    const res = await adminApiClient.post<PresignProductAssetResponse>(
        "/products/assets/presign",
        {
            productSlug,
            assetRole,
            fileName,
            contentType,
        }
    )

    return res.data.payload
}
