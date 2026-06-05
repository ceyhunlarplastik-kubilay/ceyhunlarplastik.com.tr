import { adminApiClient } from "@/lib/http/client"
import type { AssetRole } from "@/features/public/assets/types"
import type { PresignProductAssetResponse } from "./types"

export type ProductAssetUploadPurpose = "PRODUCT_ASSET" | "INDUSTRIAL_USAGE_IMAGE"

type Params = {
    productSlug: string
    assetRole?: AssetRole
    fileName: string
    contentType: string
    purpose?: ProductAssetUploadPurpose
}

export async function presignProductAsset({
    productSlug,
    assetRole,
    fileName,
    contentType,
    purpose,
}: Params): Promise<PresignProductAssetResponse["payload"]> {
    const res = await adminApiClient.post<PresignProductAssetResponse>(
        "/products/assets/presign",
        {
            productSlug,
            assetRole,
            fileName,
            contentType,
            purpose,
        }
    )

    return res.data.payload
}
