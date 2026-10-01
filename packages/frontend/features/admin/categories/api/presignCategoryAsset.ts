import { adminApiClient } from "@/lib/http/client"

type Params = {
    // Görsel yalnız VAR OLAN kategoriye eklenir: sunucu anahtarı ve PENDING_UPLOAD
    // satırını birlikte üretir, S3 ObjectCreated olayı satırı ACTIVE'e çevirir.
    // Klasör kategorinin kaydındaki slug'dan gelir; istemci anahtar seçemez.
    categoryId: string
    assetRole: string
    assetType: string
    fileName: string
    contentType: string
}

type Response = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
        url: string
        assetId: string
    }
}

export async function presignCategoryAsset({
    categoryId,
    assetRole,
    assetType,
    fileName,
    contentType,
}: Params) {

    const res = await adminApiClient.post<Response>(
        "/categories/assets/presign",
        {
            categoryId,
            assetRole,
            assetType,
            fileName,
            contentType,
        }
    )

    return res.data.payload
}
