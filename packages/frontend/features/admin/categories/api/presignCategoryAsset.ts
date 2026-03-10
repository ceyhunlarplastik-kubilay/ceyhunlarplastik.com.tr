import { adminApiClient } from "@/lib/http/client"

type Params = {
    categorySlug: string
    assetRole: string
    fileName: string
    contentType: string
}

type Response = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
        url: string
    }
}

export async function presignCategoryAsset({
    categorySlug,
    assetRole,
    fileName,
    contentType,
}: Params) {

    const res = await adminApiClient.post<Response>(
        "/categories/assets/presign",
        {
            categorySlug,
            assetRole,
            fileName,
            contentType,
        }
    )

    return res.data.payload
}