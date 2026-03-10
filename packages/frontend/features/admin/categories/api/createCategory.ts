import { adminApiClient } from "@/lib/http/client"

import type { Category } from "@/features/public/categories/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"

import type { CreateCategoryResponse } from "./types"

type Params = {
    code: number
    name: string

    assetType?: AssetType
    assetRole?: AssetRole

    assetKey?: string
    mimeType?: string
}

export async function createCategory({
    code,
    name,
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
                assetType,
                assetRole,
                assetKey,
                mimeType,
            }
        )

    return res.data.payload.category
}
