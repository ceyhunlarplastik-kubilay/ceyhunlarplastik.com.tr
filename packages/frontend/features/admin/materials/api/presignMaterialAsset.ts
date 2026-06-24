import { adminApiClient } from "@/lib/http/client"
import type { PresignMaterialAssetResponse } from "./types"

type Params = {
    materialId: string
    fileName: string
    contentType: string
}

export async function presignMaterialAsset({ materialId, fileName, contentType }: Params) {
    const res = await adminApiClient.post<PresignMaterialAssetResponse>(
        `/materials/${materialId}/assets/presign`,
        {
            fileName,
            contentType,
            assetRole: "CERTIFICATE",
        },
    )

    return res.data.payload
}
