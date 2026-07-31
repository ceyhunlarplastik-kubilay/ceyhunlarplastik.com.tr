import { adminApiClient } from "@/lib/http/client"
import { normalizeCategory } from "@/features/public/categories/normalizeCategory"
import type { SupportedLocale, TargetLocale } from "@core/i18n/locales"

export type UpdateCategoryParams = {
    id: string
    name?: string
    translations?: Array<{
        locale: SupportedLocale
        name: string
        slug?: string
    }>
    removeTranslationLocales?: TargetLocale[]
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
