import { adminApiClient } from "@/lib/http/client"

import type { Category } from "@/features/public/categories/types"
import { normalizeCategory } from "@/features/public/categories/normalizeCategory"
import type { AssetRole, AssetType } from "@/features/public/assets/types"

import type { CreateCategoryResponse } from "./types"

type Params = {
    code: number
    name: string
    translations?: Array<{
        locale: "tr" | "en"
        name: string
        slug?: string
    }>
    allowedAttributeValueIds?: string[]

    assetType?: AssetType
    assetRole?: AssetRole

    assetKey?: string
    mimeType?: string
}

export async function createCategory({
    code,
    name,
    translations,
    allowedAttributeValueIds,
    assetType,
    assetRole,
    assetKey,
    mimeType,
}: Params): Promise<Category> {

    const res =
        await adminApiClient.post<CreateCategoryResponse>(
            "/categories",
            {
                code,
                name,
                translations,
                allowedAttributeValueIds,
                assetType,
                assetRole,
                assetKey,
                mimeType,
            }
        )

    return normalizeCategory(res.data.payload.category, "tr")
}
