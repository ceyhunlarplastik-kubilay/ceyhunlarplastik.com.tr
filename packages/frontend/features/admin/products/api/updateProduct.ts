import { adminApiClient } from "@/lib/http/client"

import type { Product } from "@/features/public/products/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"

import type { UpdateProductResponse } from "./types"

type Params = {
    id: string

    code?: string
    name?: string
    categoryId?: string

    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
    attributeValueIds?: string[]
}

export async function updateProduct({
    id,
    code,
    name,
    categoryId,
    assetType,
    assetRole,
    assetKey,
    mimeType,
    attributeValueIds
}: Params): Promise<Product> {
    const res = await adminApiClient.put<UpdateProductResponse>(
        `/products/${id}`,
        {
            code,
            name,
            categoryId,
            assetType,
            assetRole,
            assetKey,
            mimeType,
            attributeValueIds
        }
    )
    return res.data.payload.product
}
