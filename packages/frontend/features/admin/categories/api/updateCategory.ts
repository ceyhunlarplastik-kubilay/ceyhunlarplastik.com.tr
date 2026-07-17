import { adminApiClient } from "@/lib/http/client"
import { normalizeCategory } from "@/features/public/categories/normalizeCategory"

export type UpdateCategoryParams = {
    id: string
    name?: string
    translations?: Array<{
        locale: "tr" | "en"
        name: string
        slug?: string
    }>
    removeTranslationLocales?: Array<"en">
    allowedAttributeValueIds?: string[]
    assetKey?: string
    assetRole?: string
    assetType?: string
    mimeType?: string
}

export async function updateCategory(params: UpdateCategoryParams) {

    const { id, ...body } = params

    const res = await adminApiClient.put(
        `/categories/${id}`,
        body
    )

    return normalizeCategory(res.data.payload.category, "tr")
}
