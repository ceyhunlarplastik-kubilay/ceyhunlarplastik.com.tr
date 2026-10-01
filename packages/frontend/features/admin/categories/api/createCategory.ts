import { adminApiClient } from "@/lib/http/client"

import type { Category } from "@/features/public/categories/types"
import { normalizeCategory } from "@/features/public/categories/normalizeCategory"

import type { CreateCategoryResponse } from "./types"
import type { SupportedLocale } from "@core/i18n/locales"

type Params = {
    code: number
    name: string
    translations?: Array<{
        locale: SupportedLocale
        name: string
        slug?: string
    }>
    allowedAttributeValueIds?: string[]
}

/** Görsel burada gönderilmez: kategori oluşunca `presignCategoryAsset({ categoryId })` ile eklenir. */

export async function createCategory({
    code,
    name,
    translations,
    allowedAttributeValueIds,
}: Params): Promise<Category> {

    const res =
        await adminApiClient.post<CreateCategoryResponse>(
            "/categories",
            {
                code,
                name,
                translations,
                allowedAttributeValueIds,
            }
        )

    return normalizeCategory(res.data.payload.category, "tr")
}
