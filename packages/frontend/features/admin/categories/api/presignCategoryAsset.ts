import { adminApiClient } from "@/lib/http/client"

type Params = {
    // categoryId + assetType birlikte verilirse presign PENDING_UPLOAD Asset
    // satırını da oluşturur (AssetUploader). CategoryCreateForm ikisini de
    // vermez — satırı createCategory yazar.
    categoryId?: string
    categorySlug: string
    assetRole: string
    assetType?: string
    fileName: string
    contentType: string
}

type Response = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
        url: string
        // Presign artık PENDING_UPLOAD Asset satırı da oluşturur; bu onun id'si.
        // S3 ObjectCreated event'i satırı bu id'li key üzerinden ACTIVE'e çevirir.
        assetId: string
    }
}

export async function presignCategoryAsset({
    categoryId,
    categorySlug,
    assetRole,
    assetType,
    fileName,
    contentType,
}: Params) {

    const res = await adminApiClient.post<Response>(
        "/categories/assets/presign",
        {
            categoryId,
            categorySlug,
            assetRole,
            assetType,
            fileName,
            contentType,
        }
    )

    return res.data.payload
}