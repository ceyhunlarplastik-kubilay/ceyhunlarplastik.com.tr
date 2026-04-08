import { adminApiClient } from "@/lib/http/client"

type Params = {
    id: string
    name?: string
    allowedAttributeValueIds?: string[]
    assetKey?: string
    assetRole?: string
    assetType?: string
    mimeType?: string
}

export async function updateCategory(params: Params) {

    const { id, ...body } = params

    const res = await adminApiClient.put(
        `/categories/${id}`,
        body
    )

    return res.data.payload.category
}
